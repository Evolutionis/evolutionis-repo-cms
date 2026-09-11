import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '@prisma/client';
import { PermissionsService } from './permissions.service';
import { ROLES_KEY } from './roles.decorator';

/**
 * Confere o papel direto no banco a cada chamada, em vez de confiar no que
 * foi assinado no JWT no momento do login. O token dura 8h (auth.module.ts);
 * se a checagem confiasse nele, rebaixar um ADMIN para EDITOR — ou excluí-lo
 * — só valeria de verdade depois que o token dele expirasse. Nestas rotas
 * (promover para produção, gerenciar usuários) esse atraso é o problema, não
 * um detalhe: é exatamente o poder que se está tentando tirar da pessoa.
 *
 * Roda depois do AuthGuard('jwt') — usa @UseGuards(AuthGuard('jwt'), RolesGuard).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // getAllAndOverride (não getHandler() sozinho) é o que faz um @Roles() no
    // CONTROLLER valer para toda rota dele — é assim que UsersController
    // protege list/create/setRole/etc com um decorator só, na classe. Só olhar
    // o handler acha apenas @Roles() postos método a método (como em
    // ContentController.promote) e deixa as rotas de UsersController abertas.
    const exigidos = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!exigidos || exigidos.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('Não autenticado.');

    const papel = await this.permissions.papelAtual(userId);
    if (!papel || !exigidos.includes(papel)) {
      throw new ForbiddenException('Você não tem permissão para esta ação.');
    }
    return true;
  }
}
