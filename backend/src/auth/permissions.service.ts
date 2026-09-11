import { Injectable } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { PrismaService } from '../prisma.service';

/**
 * Único lugar que lê papel de usuário direto do banco.
 *
 * Existe separado do RolesGuard porque uma rota — o rollback de PRODUÇÃO —
 * só deve exigir ADMIN quando o parâmetro `ambiente` for "prod"; a decisão
 * depende do corpo da requisição, não só da rota, então o decorator
 * `@Roles()` (que olha só o handler) não dá conta sozinho. O controller usa
 * este serviço direto nesse caso; em todo o resto, quem chama é o RolesGuard.
 */
@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /** Papel atual do usuário, ou null se a conta não existe (mais) — nunca do JWT. */
  async papelAtual(userId: string): Promise<AdminRole | null> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role ?? null;
  }
}
