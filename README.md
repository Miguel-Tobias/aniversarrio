# Aniversário — Site de Convite

Site para **festa de aniversário** com confirmação de presença, contagem regressiva e lista de presentes via PIX.

## Stack

- React + Vite + TypeScript
- PIX **estático** (QR gerado no browser)
- Supabase **opcional** (catálogo, RSVP, painel admin)

## Configuração rápida

1. Copie `.env.example` para `.env`
2. Preencha PIX e Supabase (se usar):

```env
VITE_PIX_KEY=sua-chave-pix
VITE_PIX_MERCHANT_NAME=Nome do recebedor
VITE_PIX_MERCHANT_CITY=BELEM

VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

3. Edite `src/config.ts` — nome, idade, data, local, valores de presente
4. Coloque fotos em `public/fotos/` (ex.: `foto-01.jpg`, `foto-02.jpg`)
5. Instale e rode:

```bash
npm install
npm run dev
```

## Presentes

Valores fixos (R$ 50, 100, 150, 200) definidos em `giftFixedAmounts` no `config.ts`. Sem fotos — o convidado escolhe o valor e paga via PIX.

## Supabase (opcional)

1. Crie um **novo** projeto no Supabase (separado de outros sites)
2. Rode as migrações em `supabase/migrations/` (001 a 011)
3. Crie um usuário admin e insira em `app_admins`

## Deploy

```bash
npm run build
```

Publique a pasta `dist/`.
