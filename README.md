# UrTurn

A mobile-first web application for organizing casual racket and paddle sports sessions — automating matchmaking, live score tracking, and spectator viewing.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Aceternity UI |
| State | TanStack Query + React Context |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Matchmaking | Supabase Edge Functions (Deno/TypeScript) |
| Hosting | Vercel |

## Supported Sports
- 🎾 Tennis
- 🏸 Badminton
- 🏓 Table Tennis
- 🎾 Padel

## Supported Formats
- Singles (1v1)
- Fixed Doubles
- Mixed Doubles (1M + 1F per team)
- Americano (round-robin rotation)

## Project Structure

```
urturn/
├── apps/
│   └── web/              # Next.js frontend (this app)
├── supabase/
│   ├── migrations/       # PostgreSQL migration files
│   ├── functions/        # Edge Functions (Deno/TypeScript)
│   └── config.toml       # Supabase CLI config
└── .github/
    └── workflows/        # CI/CD pipelines
```

## Getting Started

### Prerequisites
- Node.js >= 20
- Supabase CLI
- A Supabase project

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
4. Fill in your Supabase credentials in `.env.local`
5. Run database migrations:
   ```bash
   supabase db push
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

See `apps/web/.env.example` for all required variables.
