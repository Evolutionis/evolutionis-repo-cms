import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { validarSenhaForte } from '../auth/senha.util';

const SELECAO_PUBLICA = {
  id: true,
  username: true,
  role: true,
  totpEnabled: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: SELECAO_PUBLICA,
    });
  }

  async create(username: string, password: string, role: AdminRole) {
    if (!username || username.trim().length < 3) {
      throw new BadRequestException('O nome de usuário precisa ter pelo menos 3 caracteres.');
    }
    validarSenhaForte(password);
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      return await this.prisma.adminUser.create({
        data: { username: username.trim(), passwordHash, role },
        select: SELECAO_PUBLICA,
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Já existe um usuário com esse nome.');
      throw e;
    }
  }

  /**
   * Muda o papel de outra conta. "Outra": ninguém tira o próprio ADMIN por
   * aqui — é a trava que, na prática, já impede o painel de ficar sem
   * administrador (rebaixar ou excluir sempre passa pela conta de ALGUÉM
   * mais, que só existe logada como ADMIN se houver pelo menos dois).
   * garantirNaoUltimoAdmin() abaixo é a segunda trava, redundante hoje com
   * essa primeira — mantida como cinto e suspensório para o dia em que a
   * proibição de auto-edição acima for relaxada ou removida.
   */
  async setRole(id: string, role: AdminRole, requesterId: string) {
    if (id === requesterId) {
      throw new BadRequestException('Você não pode alterar o próprio papel.');
    }
    if (role !== 'ADMIN') {
      await this.garantirNaoUltimoAdmin(id);
    }
    const user = await this.prisma.adminUser
      .update({ where: { id }, data: { role }, select: SELECAO_PUBLICA })
      .catch(() => null);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async resetPassword(id: string, password: string) {
    validarSenhaForte(password);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.adminUser
      .update({ where: { id }, data: { passwordHash }, select: { id: true } })
      .catch(() => null);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return { ok: true };
  }

  async remove(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new BadRequestException('Você não pode excluir a própria conta.');
    }
    await this.garantirNaoUltimoAdmin(id);
    const removido = await this.prisma.adminUser.delete({ where: { id } }).catch(() => null);
    if (!removido) throw new NotFoundException('Usuário não encontrado.');
    return { ok: true };
  }

  /** Recusa rebaixar ou excluir o único ADMIN restante. */
  private async garantirNaoUltimoAdmin(id: string) {
    const alvo = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!alvo || alvo.role !== 'ADMIN') return;
    const totalAdmins = await this.prisma.adminUser.count({ where: { role: 'ADMIN' } });
    if (totalAdmins <= 1) {
      throw new BadRequestException('Precisa haver pelo menos um administrador — promova outra conta antes.');
    }
  }
}
