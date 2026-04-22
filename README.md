# Só Casa Top

Plataforma de imóveis de alto padrão em Brasília, com bot de WhatsApp integrado com IA, catálogo web e painel administrativo.

## Stack

- Node.js + Express
- Supabase (PostgreSQL)
- OpenAI (GPT-4o)
- WhatsApp Business API (Meta Cloud API)
- Instagram Graph API
- Nginx + PM2

## Estrutura

```
src/
  config/        Configurações (Supabase client)
  controllers/   Lógica dos endpoints (WhatsApp, Instagram, imoveis, corretores)
  routes/        Rotas Express
  services/      Integrações externas (AI, WhatsApp, Instagram, leads)
  views/         Renderização de páginas (imovel)
catalog/         Site público (catálogo de imóveis)
```

## Desenvolvimento

```bash
npm install
cp .env.example .env
# preencher variáveis de ambiente
node src/index.js
```

## Variáveis de ambiente

Ver `.env.example` para a lista completa.

Principais:
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
- `ADM_PHONE`, `CORRETOR_PHONES`

## Deploy

PM2 no servidor. Nginx faz proxy reverso para `http://127.0.0.1:3000`.
