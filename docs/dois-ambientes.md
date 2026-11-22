# Homologação e produção

O painel passou a publicar em dois lugares. Este documento diz o que existe,
em que ordem ligar, e o que quebra se a ordem for outra.

## O desenho

```
painel  --[Publicar em homologação]-->  branch homolog  -->  public_html/preview/
   |                                                              (você confere)
   \----[Promover para produção]----->  branch main     -->  public_html/
                                                              (o cliente vê)
```

Editar e publicar mexe **só** em homologação. O site do cliente não muda até
alguém apertar *Promover para produção*. É essa separação que permite errar no
preview sem consequência.

Promover **não cria versão nova**: marca a mesma versão como no ar também em
produção. É literalmente o mesmo conteúdo — uma segunda versão só duplicaria o
histórico sem nada ter mudado.

## O que muda em cada repositório

**`evolutionis-repo-cms`** (este)

| Onde | O quê |
|---|---|
| `backend/prisma/schema.prisma` | `isCurrent` virou `isCurrentHomolog` + `isCurrentProd` |
| `backend/prisma/migrations/20260830120000_dois_ambientes/` | renomeia a coluna e cria os índices |
| `backend/src/github/github.service.ts` | `commitContent` recebe o branch; imagem sobe nos dois |
| `backend/src/content/content.service.ts` | `publish` / `promote` / `status` / `rollback` por ambiente |
| `backend/src/content/content.controller.ts` | `GET /content/status`, `POST /content/promote`, `?ambiente=` |
| `admin/src/lib/api.js` | `promote()`, `status()`, `ambiente` |
| `admin/src/App.jsx` | os dois botões e o cartão dos dois ambientes |

**`evolutionis-repo-site`** (o outro)

| Onde | O quê |
|---|---|
| `.github/workflows/deploy.yml` | passa a rodar em `homolog`, não em `main` |
| `.github/workflows/deploy-producao.yml` | novo: roda em `main`, publica na raiz |
| `vite.config.js` | `base` vem de `VITE_BASE`, com `/preview/` como padrão |

O `base` do Vite entra nos caminhos dos assets **no momento do build**: não dá
para decidir depois. O workflow de produção define `VITE_BASE=/`. Sem isso o
build sai apontando para `/preview/` e, na raiz, a página abre em branco — sem
erro nenhum aparecer no servidor.

## Variáveis novas do backend (Railway)

```
GITHUB_BRANCH_HOMOLOG   branch de homologação (padrão: homolog)
GITHUB_BRANCH_PROD      branch de produção   (padrão: main)
GITHUB_BRANCH           continua valendo como produção, para não quebrar o que já roda
```

## Ordem de ligar

A ordem importa: cada passo pressupõe o anterior.

1. **Backup de `public_html/` por FTP.** O primeiro deploy de produção escreve
   na raiz da hospedagem. Se já houver um site ali, é ele que vai ser
   substituído. Este passo não tem desfazer.
2. **Criar a branch `homolog`** no repositório do site, a partir da `main`.
   Sem ela, o workflow de homologação não tem onde rodar e publicar pelo painel
   passa a falhar.
3. **Mesclar a TAR-04** no repositório do site. A partir daqui a `main` deploya
   na raiz — por isso o backup vem antes.
4. **Aplicar a migração num banco de teste**, conferir, e só então no de
   produção. A migração renomeia uma coluna: rodar contra um banco onde o
   código antigo ainda está no ar derruba o backend.
5. **Mesclar este repositório** e configurar as variáveis no Railway.
6. **Primeira promoção.** Confira o `/preview/`, aperte *Promover para
   produção*, e acompanhe o workflow `Deploy producao` na aba Actions.

## Armadilhas

- **`dangerous-clean-slate` tem que ser `false` nos dois workflows.** Com
  `true`, a action apaga tudo em `public_html/` antes de enviar — inclusive a
  pasta `preview/`. O workflow de produção também exclui `preview/**` por
  garantia.
- **Imagem sobe nos dois branches, sempre.** Se ficasse só em homologação,
  promover o `content.json` levaria junto a URL de uma imagem que não existe em
  produção, e o site mostraria um espaço vazio, sem erro.
- **Os índices únicos parciais** da migração impedem duas versões marcadas no
  mesmo ambiente. Por isso `promote()` e `novaVersaoHomolog()` **desmarcam antes
  de marcar**, na mesma transação. A ordem não é decorativa.

## Limpeza de imagens sem uso

O painel envia a imagem assim que o arquivo é escolhido (e para os dois
branches) e não tem como apagá-la. Quem desiste ou troca de imagem deixa um
arquivo órfão em `public/images/`. A limpeza roda no fim de *Promover para
produção* (e do rollback de produção), que é o único momento em que se sabe o
que está em uso.

**Variável `LIMPAR_IMAGENS`** (Railway):

| valor | efeito |
|---|---|
| `simular` (padrão, e qualquer valor desconhecido) | só escreve no log "Apagaria em main: [...]"; nada é apagado |
| `ligado` | apaga de verdade |
| `desligado` | nem lista |

**Uma imagem só é apagada se, ao mesmo tempo:**
- tem o carimbo `Date.now()-` no nome (foi enviada pelo painel; arquivos
  colocados à mão nunca são tocados);
- foi enviada há mais de 24 horas (pode estar num rascunho ainda sem salvar);
- não é citada (`/images/<arquivo>`) pelo conteúdo que está indo para
  produção, pela versão atual da homologação, pelas 5 últimas versões do
  histórico, nem pelo `content.json` real de cada branch (que pode ter sido
  corrigido à mão por PR).

**Travas:** se a lista passar de 20 arquivos, ou se nenhum conteúdo citar
imagem alguma, nada é apagado. Qualquer erro na limpeza vira aviso no log e a
promoção segue normalmente.

**Como roda:** na `main`, o `content.json` e as remoções vão num commit só (Git
Data API, um deploy só); na homolog, as remoções vão num commit à parte.

**Limite conhecido:** reverter produção para uma versão mais antiga que as 5
protegidas pode trazer a URL de uma imagem já apagada; o site mostra um espaço
vazio, sem erro.

**Ligar com segurança:** deixe em `simular`, promova algumas vezes, confira no
log se a lista "Apagaria..." é só lixo, e então mude para `ligado`.

## Como conferir que ficou certo

- `GET /content/status` responde com os dois ambientes e `sincronizado`.
- No painel, o cartão "Os dois ambientes" mostra as duas versões, e o botão
  *Promover para produção* fica desabilitado quando as duas são a mesma.
- `/preview/` e a raiz do site abrem, cada um com o seu conteúdo.
