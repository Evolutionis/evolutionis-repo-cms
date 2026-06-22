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
