-- Papel do usuário (ADMIN ou EDITOR) e suporte a 2FA (TOTP) por conta.
--
-- Sem isto só existe um tipo de usuário no painel: qualquer login publica em
-- homologação e promove para produção. Daqui pra frente EDITOR fica limitado
-- a homologação; só ADMIN promove para o site do cliente e mexe em outras
-- contas (backend/src/auth/roles.guard.ts é quem cobra isso).
--
-- Todo usuário já cadastrado vira ADMIN nesta migração — é o único jeito de
-- não trancar quem já usa o painel para fora das próprias funções
-- administrativas. Contas novas entram como EDITOR (o padrão da coluna) e um
-- ADMIN as eleva se for o caso.

CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'EDITOR');

ALTER TABLE "AdminUser" ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'EDITOR';
UPDATE "AdminUser" SET "role" = 'ADMIN';

-- totpSecret começa preenchido e totpEnabled só vira true depois que o dono
-- confirma um código válido (AuthService.enable2fa) — assim gerar o QR code
-- e nunca escanear não liga 2FA sozinho e tranca ninguém para fora.
ALTER TABLE "AdminUser" ADD COLUMN "totpSecret" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
