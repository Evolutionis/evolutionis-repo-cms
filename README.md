# Evolutionis CMS — Playbook (Admin + Backend)

Este repositório contém o "motor" que gerencia o conteúdo, imagens e identidade visual do site da Evolutionis. Ele é dividido em duas partes:

1. **Backend (NestJS)**: Uma API robusta que salva o conteúdo no banco de dados e sincroniza os arquivos (`content.json` e imagens) com o repositório do site ou em uma pasta local.
2. **Admin (React)**: O painel de controle interativo onde o usuário edita as informações e cores.

---

## 🛠️ Passo a Passo: Como Rodar Localmente

### 1. Backend (NestJS)

O backend é a primeira coisa que deve estar rodando, pois o Admin depende dele.

```bash
cd backend
npm install
```

**Configurar Variáveis de Ambiente:**
Copie o arquivo `.env.example` para `.env` e preencha com as credenciais do seu banco de dados PostgreSQL.
Se você estiver testando localmente junto com o site, configure a variável `LOCAL_SITE_PATH`:
```env
LOCAL_SITE_PATH="/Caminho/Absoluto/Para/evolutionis-repo-site"
```
*(Isso fará com que o backend salve o `content.json` e imagens diretamente na pasta do site no seu computador, dispensando a necessidade de "commits" reais no GitHub durante o desenvolvimento!)*

**Iniciar o Banco e o Servidor:**
```bash
npx prisma migrate dev --name init   # Prepara o banco de dados
npm run seed                         # Cria o usuário admin inicial
npm run start:dev                    # Inicia o servidor (na porta 3000)
```

### 2. Admin (React)

Com o backend rodando, abra um novo terminal para iniciar o painel.

```bash
cd admin
npm install
cp .env.example .env     # Certifique-se de que VITE_API_URL aponta para o backend
npm run dev              # Inicia o painel
```

---

## 🎨 Como Utilizar o Painel (Admin)

1. **Login**: Acesse a URL que o `npm run dev` forneceu (ex: `http://localhost:5174`) e use o login e senha configurados na sua variável de ambiente `SEED_ADMIN_USER` e `SEED_ADMIN_PASS`.
2. **Identidade Visual**: Na primeira aba do painel, você pode alterar as cores principais (botões, fundo, texto) utilizando o seletor visual e enviar uma nova Logo.
3. **Seções de Conteúdo**: Navegue pelas abas "Cabeçalho & Menu", "Início (Hero)" e "Rodapé" para editar os textos do site.
4. **Publicação**: Ao clicar em **"Salvar Rascunho"**, você guarda as alterações no banco de dados. Ao clicar em **"Publicar"**, o backend gera o `content.json` e as imagens, enviando tudo para o site (seja para a pasta local via `LOCAL_SITE_PATH` ou via GitHub API em produção).

---

## ⚙️ Como Alterar a Estrutura (Schema)

Se você desejar adicionar novos campos ao painel no futuro, basta editar o arquivo:
`admin/src/lib/schema.js`

O painel lê este arquivo dinamicamente e desenha a interface automaticamente com suporte a textos (`text`, `textarea`), imagens (`image`), ícones (`icon`) e seletores de cores (`color`).
