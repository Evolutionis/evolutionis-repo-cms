import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminRole } from '@prisma/client';
import { UsersService } from './users.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

// Toda rota aqui é coisa de ADMIN: criar conta, mudar papel, resetar senha de
// outra pessoa ou excluir. RolesGuard confere isso direto no banco a cada
// chamada — ver o comentário em roles.guard.ts sobre por quê.
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Post()
  create(@Body() body: { username: string; password: string; role?: AdminRole }) {
    return this.users.create(body.username, body.password, body.role || 'EDITOR');
  }

  @Patch(':id/role')
  setRole(@Param('id') id: string, @Body() body: { role: AdminRole }, @Req() req: any) {
    return this.users.setRole(id, body.role, req.user.userId);
  }

  // Reset feito pelo administrador: ele define a senha nova e repassa para o
  // dono da conta por um canal seguro (não é o mesmo que a troca de senha em
  // auth.controller.ts, que exige a senha atual e é sempre autoatendimento).
  @Patch(':id/password')
  resetPassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.users.resetPassword(id, body.password);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.users.remove(id, req.user.userId);
  }
}
