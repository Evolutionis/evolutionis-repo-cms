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

## Como conferir que ficou certo

- `GET /content/status` responde com os dois ambientes e `sincronizado`.
- No painel, o cartão "Os dois ambientes" mostra as duas versões, e o botão
  *Promover para produção* fica desabilitado quando as duas são a mesma.
- `/preview/` e a raiz do site abrem, cada um com o seu conteúdo.
