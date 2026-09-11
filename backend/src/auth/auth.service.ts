import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { PrismaService } from '../prisma.service';
import { validarSenhaForte } from './senha.util';

interface TentativaLogin {
  falhas: number;
  bloqueadoAte: number | null;
  ultimaFalha: number;
}

// ±1 passo (30s) de tolerância a relógio dessincronizado entre o celular que
// gera o código e o servidor. Mais que isso alarga demais a janela de acerto
// por força bruta; menos, e um segundo de atraso no relógio do usuário já
// derruba um código válido. `authenticator` é um singleton do otplib: a opção
// vale para todo `.verify()` do processo, por isso é setada uma vez aqui.
authenticator.options = { window: 1 };
const TOTP_EMISSOR = 'Evolutionis CMS';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // Achado A3: bloqueio progressivo por username, complementar ao rate
  // limit por IP do AuthController. Guardado em memória — reinicia se o
  // processo reiniciar, e não é compartilhado entre réplicas se o backend
  // rodar com mais de uma instância. Suficiente para o cenário atual (poucos
  // usuários admin, uma instância no Railway); se isso mudar, mover para uma
  // tabela ou cache compartilhado (ex. Redis).
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

  /**
   * Login em duas etapas quando a conta tem 2FA ativo: usuário+senha certos
   * mas sem `totpCode` devolve `requiresTotp` sem contar como falha — a senha
   * estava certa, só falta o código; um código ERRADO é que soma ao bloqueio
   * progressivo, senão alguém digitando a senha sem o celular em mãos ainda
   * gastaria as próprias tentativas à toa.
   */
  async login(username: string, password: string, totpCode?: string) {
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

    if (user.totpEnabled) {
      if (!totpCode) {
        throw new UnauthorizedException({
          statusCode: 401,
          requiresTotp: true,
          message: 'Informe o código do aplicativo autenticador.',
        });
      }
      const codigoOk = authenticator.verify({ token: totpCode, secret: user.totpSecret! });
      if (!codigoOk) {
        this.registrarFalha(username, registro, agora);
        throw new UnauthorizedException('Código do autenticador inválido.');
      }
    }

    this.tentativas.delete(username);

    const token = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
    });

    return { access_token: token, username: user.username, role: user.role };
  }

  /** Dados frescos da conta logada — sempre do banco, nunca do JWT, que pode estar defasado. */
  async me(userId: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Conta não encontrada.');
    return { id: user.id, username: user.username, role: user.role, totpEnabled: user.totpEnabled };
  }

  /** Troca de senha da própria conta — exige a senha atual, não só o JWT válido. */
  async changePassword(userId: string, senhaAtual: string, novaSenha: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(senhaAtual, user.passwordHash))) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }
    validarSenhaForte(novaSenha);
    const passwordHash = await bcrypt.hash(novaSenha, 10);
    await this.prisma.adminUser.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  }

  /**
   * Gera um novo segredo TOTP e devolve o QR code para escanear num app
   * autenticador (Google Authenticator, Authy, 1Password, etc). Grava o
   * segredo já, mas `totpEnabled` só liga em enable2fa — gerar o QR code e
   * nunca confirmar não tranca a conta para fora no próximo login.
   */
  async setup2fa(userId: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Conta não encontrada.');

    // 20 bytes (160 bits) em vez do padrão da lib (10 bytes / 80 bits): mesmo
    // tamanho do resumo SHA-1 usado no cálculo do código, e ainda compatível
    // com os apps autenticadores comuns.
    const secret = authenticator.generateSecret(20);
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { totpSecret: secret, totpEnabled: false },
    });

    const otpauth = authenticator.keyuri(user.username, TOTP_EMISSOR, secret);
    const qrDataUrl = await qrcode.toDataURL(otpauth);
    return { secret, qrDataUrl };
  }

  /** Confirma o 2FA: só liga depois de um código válido — prova de que o app foi configurado certo. */
  async enable2fa(userId: string, code: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) {
      throw new BadRequestException('Gere o código de configuração (QR) antes de ativar.');
    }
    const codigoOk = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!codigoOk) throw new UnauthorizedException('Código inválido.');

    await this.prisma.adminUser.update({ where: { id: userId }, data: { totpEnabled: true } });
    return { totpEnabled: true };
  }

  /** Desativa o 2FA. Exige a senha de novo — só o JWT válido não basta para desligar uma trava de segurança. */
  async disable2fa(userId: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Senha incorreta.');
    }
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });
    return { totpEnabled: false };
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
