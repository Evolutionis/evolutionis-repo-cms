import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';

interface TentativaLogin {
  falhas: number;
  bloqueadoAte: number | null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // Achado A3: bloqueio progressivo por username, complementar ao rate
  // limit por IP do AuthController. Guardado em memória — reinicia se o
  // processo reiniciar, e não é compartilhado entre réplicas se o backend
  // rodar com mais de uma instância. Suficiente para o cenário atual (um
  // único usuário admin, uma instância no Railway); se isso mudar, mover
  // para uma tabela ou cache compartilhado (ex. Redis).
  private readonly tentativas = new Map<string, TentativaLogin>();
  private readonly MAX_FALHAS_ANTES_DE_BLOQUEAR = 5;
  private readonly BLOQUEIO_BASE_MS = 30_000; // 30s
  private readonly BLOQUEIO_TETO_MS = 30 * 60_000; // 30min

  async login(username: string, password: string) {
    const agora = Date.now();
    const registro = this.tentativas.get(username);

    if (registro?.bloqueadoAte && registro.bloqueadoAte > agora) {
      throw new UnauthorizedException('Muitas tentativas. Tente novamente em alguns instantes.');
    }

    const user = await this.prisma.adminUser.findUnique({ where: { username } });
    const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !ok) {
      this.registrarFalha(username, registro, agora);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.tentativas.delete(username);

    const token = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
    });

    return { access_token: token, username: user.username };
  }

  private registrarFalha(username: string, registro: TentativaLogin | undefined, agora: number) {
    const falhas = (registro?.falhas ?? 0) + 1;
    let bloqueadoAte: number | null = null;

    if (falhas >= this.MAX_FALHAS_ANTES_DE_BLOQUEAR) {
      const excedente = falhas - this.MAX_FALHAS_ANTES_DE_BLOQUEAR;
      const duracao = Math.min(this.BLOQUEIO_BASE_MS * 2 ** excedente, this.BLOQUEIO_TETO_MS);
      bloqueadoAte = agora + duracao;
    }

    this.tentativas.set(username, { falhas, bloqueadoAte });
  }
}
