# Aniversário — Site de Convite

Site para **festa de aniversário** do Miguel Vaz com confirmação de presença e tema Flamengo.

## Stack

- React + Vite + TypeScript
- Supabase **opcional** (lista de convidados, RSVP e painel admin)

## Configuração rápida

1. Copie `.env.example` para `.env`
2. Preencha Supabase (se usar):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

3. Edite `src/config.ts` — nome, idade, data, local
4. Instale e rode:

```bash
npm install
npm run dev
```

## Supabase (opcional)

1. Crie um **novo** projeto no Supabase
2. Rode as migrações em `supabase/migrations/` (002, 003, 005 a 009)
3. Crie um usuário admin e insira em `app_admins`

## Deploy

```bash
npm run build
```

Publique a pasta `dist/` ou use o workflow GitHub Pages (`.github/workflows/deploy-github-pages.yml`).

Para site em `usuario.github.io/nome-do-repo`, configure a variable `VITE_BASE_URL` = `/nome-do-repo/`.
