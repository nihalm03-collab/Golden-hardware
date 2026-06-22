# Golden Hardwares

Next.js 14 + TypeScript + Tailwind CSS starter for inventory and sales management.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add env vars:

```bash
cp .env.local.example .env.local
```

Set values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Run dev server:

```bash
npm run dev
```

## Supabase schema

Run SQL from `supabase/schema.sql` in Supabase SQL editor.
