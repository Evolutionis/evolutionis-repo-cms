import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Marca uma rota como exigindo um dos papéis dados. Ver RolesGuard. */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
