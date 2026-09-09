import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';

interface TentativaLogin {
  falhas: number;
  bloqueadoAte: number | null;
  ultimaFalha: number;
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

  // O mapa é indexado pelo username RECEBIDO, não por um usuário que exista —
  // é o que faz o bloqueio valer igual para nome inexistente e não vazar quem
  // existe. O efeito colateral é que quem chama a rota escolhe as chaves: uma
  // tentativa por username diferente cria uma entrada nova a cada requisição,
  // sem autenticação nenhuma. Sem teto, isso é um vazamento de memória que
  // qualquer um alcança. Daí a janela de esquecimento e o limite de entradas.
  private readonly ESQUECER_APOS_MS = 60 * 60_000; // 1h sem falhar zera a contagem
  private readonly MAX_ENTRADAS = 10_000;

  async login(username: string, password: string) {
    const agora = Date.now();
    const registro = this.vigente(username, agora);

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

  /**
   * Registro do username, ou undefined se ele já passou da janela de
   * esquecimento. Quem errou a senha cinco vezes num dia ruim não deve carregar
   * isso para sempre; quem está atacando não fica uma hora parado esperando.
   */
  private vigente(username: string, agora: number): TentativaLogin | undefined {
    const registro = this.tentativas.get(username);
    if (!registro) return undefined;

    const bloqueado = registro.bloqueadoAte !== null && registro.bloqueadoAte > agora;
    if (!bloqueado && agora - registro.ultimaFalha > this.ESQUECER_APOS_MS) {
      this.tentativas.delete(username);
      return undefined;
    }
    return registro;
  }

  private registrarFalha(username: string, registro: TentativaLogin | undefined, agora: number) {
    const falhas = (registro?.falhas ?? 0) + 1;
    let bloqueadoAte: number | null = null;

    if (falhas >= this.MAX_FALHAS_ANTES_DE_BLOQUEAR) {
      const excedente = falhas - this.MAX_FALHAS_ANTES_DE_BLOQUEAR;
      const duracao = Math.min(this.BLOQUEIO_BASE_MS * 2 ** excedente, this.BLOQUEIO_TETO_MS);
      bloqueadoAte = agora + duracao;
    }

    this.tentativas.set(username, { falhas, bloqueadoAte, ultimaFalha: agora });
    this.podar(agora);
  }

  /**
   * Mantém o mapa dentro do teto. Primeiro descarta o que já expirou; se ainda
   * assim estourar, remove as entradas mais antigas — o Map do JavaScript
   * itera na ordem de inserção, então as primeiras são as mais velhas.
   *
   * Descartar uma entrada não solta ninguém que esteja de castigo: o rate
   * limit por IP continua valendo, e reconquistar o bloqueio custa outras
   * cinco tentativas.
   */
  private podar(agora: number) {
    if (this.tentativas.size <= this.MAX_ENTRADAS) return;

    for (const [nome, registro] of this.tentativas) {
      const bloqueado = registro.bloqueadoAte !== null && registro.bloqueadoAte > agora;
      if (!bloqueado && agora - registro.ultimaFalha > this.ESQUECER_APOS_MS) {
        this.tentativas.delete(nome);
      }
    }

    for (const nome of this.tentativas.keys()) {
      if (this.tentativas.size <= this.MAX_ENTRADAS) break;
      this.tentativas.delete(nome);
    }
  }
}
