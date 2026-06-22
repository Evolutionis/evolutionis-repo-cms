# 📱 Admin - Painel de Administração CMS

Painel administrativo em **React + Vite** para gerenciar conteúdo do CMS.

## 🚀 Como Usar

### 1. Instalação de Dependências
```bash
npm install
```

### 2. Iniciar em Desenvolvimento
```bash
npm run dev
```
O painel rodará em `http://localhost:5173`

### 3. Build para Produção
```bash
npm run build
```
Gera os arquivos otimizados em `dist/`

### 4. Preview da Versão Buildada
```bash
npm run preview
```

## 📁 Estrutura
```
admin/
├── src/              # Código-fonte React
├── index.html        # Página principal
├── vite.config.js    # Configuração do Vite
├── package.json      # Dependências do projeto
└── .env              # Variáveis de ambiente
```

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` baseado em `.env.example`:
```
VITE_API_URL=http://localhost:3000/api
```

## 🔗 Conectando com o Backend

O painel se conecta à API do backend. Certifique-se que:
- O backend está rodando em `http://localhost:3000`
- A URL da API está configurada em `.env`
- Os CORS estão habilitados no backend

## 📦 Tecnologias
- **React 18** - UI library
- **Vite** - Build tool rápido
- **Lucide React** - Ícones
