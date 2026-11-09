# AK Commerce Platform

A full-stack, multi-category commerce platform built with Next.js, React, TypeScript, Supabase, and PostgreSQL. It demonstrates product discovery, authentication, persistent carts, inventory-aware checkout, customer accounts, and order workflows.

## Highlights

- Product browsing, search, filtering, sorting, and pagination
- Variant-aware cart and stock reconciliation
- Supabase authentication with email/password and Google OAuth
- Customer profiles, order history, notifications, and admin workflows
- PostgreSQL row-level security and server-side authorization
- Stripe test-mode checkout integration
- Responsive light and dark themes

## Technology

| Area | Stack |
|---|---|
| Application | Next.js App Router, React, TypeScript, TSX |
| Styling | Tailwind CSS, PostCSS |
| Backend | Supabase Auth, PostgreSQL, Row-Level Security |
| State and validation | Zustand, Zod |
| Quality | ESLint, TypeScript |

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure Supabase and server-only payment variables in `.env.local`. Run the SQL setup scripts in `database/` before using catalog or checkout features. Never commit secrets.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Project structure

- `src/app/` — routes, pages, API handlers, and authentication flows
- `src/components/` — reusable interface components
- `src/lib/` — Supabase clients, server actions, and utilities
- `src/store/` — client state
- `database/` — schema, policies, and setup scripts

## Status

Portfolio-ready commerce application. Payment and fulfillment integrations are configured for demonstration and test environments unless separately connected to production services.

## License

MIT
