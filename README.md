# CMS — Admin (React) + Backend (NestJS)

Painel para editar o conteúdo do site e API que versiona e publica.

```
backend/   NestJS  → Railway + PostgreSQL
admin/     React   → Vercel / Netlify
```

## Backend

```
cd backend
npm install
cp .env.example .env     # preencha as variáveis
npx prisma migrate dev --name init   # primeira vez (aponta p/ o banco)
npm run seed             # cria o primeiro admin (use SEED_ADMIN_USER/PASS)
npm run start:dev
```

Deploy no Railway: adicione o plugin PostgreSQL, configure as variáveis do `.env.example`
e use o start command `npx prisma migrate deploy && npm run start:prod`.

## Admin

```
cd admin
npm install
cp .env.example .env     # VITE_API_URL = URL do backend
npm run dev
npm run build
```

As seções editáveis ficam em `admin/src/lib/schema.js`.
