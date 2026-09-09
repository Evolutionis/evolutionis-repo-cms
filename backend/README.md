# 🔌 Backend - API CMS NestJS

API RESTful em **NestJS** com banco de dados **Prisma** para gerenciar conteúdo do CMS com versionamento.

## 🚀 Como Usar

### 1. Instalação de Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados

Crie um arquivo `.env` baseado nas variáveis disponíveis:
```
DATABASE_URL="postgresql://user:password@localhost:5432/cms_db"
JWT_SECRET="sua-chave-secreta"
JWT_EXPIRATION="7d"
```

### 3. Executar Migrations do Prisma
```bash
npm run prisma:migrate
```

### 4. Seed do Banco (opcional)
```bash
npm run seed
```

### 5. Iniciar em Desenvolvimento
```bash
npm run start:dev
```
A API rodará em `http://localhost:3000`

### 6. Build para Produção
```bash
npm run build
```

### 7. Iniciar Produção
```bash
npm start
```

## 📁 Estrutura
```
backend/
├── src/              # Código-fonte NestJS
│   ├── modules/      # Módulos da aplicação
│   ├── guards/       # Guards (autenticação)
│   └── main.ts       # Entrada da aplicação
├── prisma/
│   ├── schema.prisma # Schema do banco de dados
│   └── seed.ts       # Script de seed
├── dist/             # Build compilado
├── .env              # Variáveis de ambiente
└── package.json      # Dependências do projeto
```

## 🔐 Autenticação

A API usa **JWT (JSON Web Token)** para autenticação:

1. Fazer login com credenciais
2. Receber um token JWT
3. Incluir o token no header: `Authorization: Bearer <token>`

### Limite de tentativas no login

`POST /auth/login` tem duas camadas de proteção contra força bruta:

- **Rate limit por IP**: no máximo 5 requisições por minuto (via `@nestjs/throttler`, `ThrottlerGuard` aplicado globalmente com um limite padrão de 60/min para o resto da API).
- **Bloqueio progressivo por usuário**: após 5 tentativas com o mesmo username, o login fica bloqueado por 30s, dobrando a cada nova tentativa falha (até um teto de 30min). Reinicia quando o login é bem-sucedido. Guardado em memória do processo — se o backend rodar com mais de uma instância, cada uma tem sua própria contagem.

O rate limit identifica o cliente por `req.ip`. Atrás de um proxy (é o caso do
Railway), o Express só devolve o IP real do cliente se souber quantos saltos
confiar — por isso `TRUST_PROXY_HOPS` (padrão `1`). Com o valor errado o limite
deixa de ser por IP: ou vira um balde único, em que um atacante derruba o
administrador junto, ou passa a confiar num cabeçalho que o cliente forja. Se a
infraestrutura ganhar outro proxy na frente, este número muda junto.

Os limites ficam em `src/throttler.config.ts`, num lugar só, para o teste
exercitar os mesmos valores que rodam em produção.

### Testes

```bash
npm test
```

Sobe uma aplicação Nest de verdade (com o controller, o decorator e o guard
reais; só o `AuthService` é dublado) e confere de fora a partir de qual
tentativa a resposta muda, se dois clientes têm baldes separados, e se o
bloqueio por username vale igual para um usuário que não existe — se valesse só
para os existentes, a diferença de resposta revelaria quais são.

Não usa banco nem framework de teste: é um script único rodado por `ts-node`.

## 📚 Endpoints Principais

- `POST /auth/login` - Autenticar usuário
- `GET /content` - Listar conteúdo
- `POST /content` - Criar conteúdo
- `PUT /content/:id` - Atualizar conteúdo
- `DELETE /content/:id` - Deletar conteúdo

## 🗄️ Banco de Dados

- **ORM**: Prisma
- **Database**: PostgreSQL (configurável)
- **Migrations**: Automáticas com `prisma migrate`

### Gerar Nova Migration
```bash
npx prisma migrate dev --name nome_da_migration
```

### Visualizar Banco (Prisma Studio)
```bash
npx prisma studio
```

## 📦 Tecnologias
- **NestJS** - Framework Node.js
- **Prisma** - ORM/Database Client
- **JWT** - Autenticação stateless
- **Passport** - Estratégia de autenticação
- **TypeScript** - Type safety
