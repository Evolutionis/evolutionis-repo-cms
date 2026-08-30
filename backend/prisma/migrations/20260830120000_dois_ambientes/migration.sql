-- Separa o "está no ar" em dois ambientes: homologação e produção.
--
-- O que existia antes: uma coluna isCurrent, e um único destino de deploy
-- (public_html/preview/). Ou seja, o que estava marcado como atual é exatamente
-- o que está em homologação hoje. Por isso a coluna vira isCurrentHomolog com o
-- valor preservado, e isCurrentProd nasce falso para todas as linhas: nada foi
-- promovido ainda, porque produção ainda não existia.
--
-- Reversível: os dados não são apagados, só renomeados e acrescidos.

ALTER TABLE "ContentVersion" RENAME COLUMN "isCurrent" TO "isCurrentHomolog";

ALTER TABLE "ContentVersion" ADD COLUMN "isCurrentProd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ContentVersion" ADD COLUMN "deployShaProd" TEXT;
ALTER TABLE "ContentVersion" ADD COLUMN "promotedAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "ContentVersion_isCurrent_idx";
CREATE INDEX "ContentVersion_isCurrentHomolog_idx" ON "ContentVersion"("isCurrentHomolog");
CREATE INDEX "ContentVersion_isCurrentProd_idx" ON "ContentVersion"("isCurrentProd");

-- Trava de integridade: no máximo uma versão marcada por ambiente.
-- Sem isto, uma transação interrompida no meio pode deixar duas versões
-- marcadas e o painel passa a mostrar um ambiente que não corresponde ao ar.
-- Índice parcial, por isso escrito à mão: o Prisma não gera este tipo.
CREATE UNIQUE INDEX "ContentVersion_uma_homolog"
  ON "ContentVersion"(("isCurrentHomolog")) WHERE "isCurrentHomolog";
CREATE UNIQUE INDEX "ContentVersion_uma_prod"
  ON "ContentVersion"(("isCurrentProd")) WHERE "isCurrentProd";
