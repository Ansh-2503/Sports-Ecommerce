# SportEquip — Full-Stack E-Commerce

Monorepo with a **Vite + React** storefront and an **Express + MongoDB** API.

## Project structure

```
├── Backend/          # Express API (TypeScript, ESM)
├── frontend/         # Vite + React SPA
└── README.md
```

## Prerequisites

- Node.js 20+
- MongoDB
- Stripe account (test keys for checkout)

## Setup

### Backend

```bash
cd Backend
cp .env.example .env
# Edit .env with your Mongo URI, JWT secrets, and Stripe secret key
npm install
npm run dev
```

API: `http://localhost:4000` — routes under `/api/v1`.

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_SERVER and VITE_STRIPE_KEY
npm install
npm run dev
```

App: `http://localhost:5173`

## Security notes

- Never commit `.env` files (see root `.gitignore`).
- Order totals and Stripe amounts are computed on the server from product prices.
- Use strong `JWT_SECRET` / `JWT_REFRESH_SECRET` in production.

## Scripts

| Location   | Command        | Description        |
|-----------|----------------|--------------------|
| Backend   | `npm run dev`  | Dev server (tsx)   |
| Backend   | `npm run build`| Compile TypeScript |
| frontend  | `npm run dev`  | Vite dev server    |
| frontend  | `npm run build`| Production build   |
