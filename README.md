# DLMS - Dealer Management System

A full-stack dealer management system built with Next.js, Prisma, and PostgreSQL. Manages customers, products, orders, inventory, payments, and damage tracking.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM 7
- **Database**: PostgreSQL
- **Auth**: JWT (access + refresh tokens), bcrypt password hashing
- **Language**: TypeScript

## Features

- **Dashboard** — Real-time metrics: balances, customer/product counts, stock value, dues
- **Customer Management** — Registration, due tracking, area-based organization, status control
- **Product Management** — Catalog with categories, pricing, min stock levels, multi-unit support (PCS/KG/LITER)
- **Order Management** — Creation and approval workflow, shipment tracking, partial payments
- **Inventory** — Stock intake recording, damage/loss tracking, stock value calculation
- **Payments** — Cash, bank transfer, cheque, mobile banking support
- **Role-based Access** — SUPER_ADMIN and STOCK roles

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dlms"
JWT_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="your-secure-password"
```

3. Run database migrations and seed:

```bash
npx prisma migrate deploy
npm run postdeploy
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login page
│   ├── (dashboard)/      # Dashboard, customers, products, orders, damages, inventory, reports, settings
│   └── api/              # REST API routes for all entities
├── components/
│   └── layout/           # Sidebar navigation
├── generated/            # Prisma generated client
└── lib/                  # Auth utils, Prisma client, formatting helpers
prisma/
├── schema.prisma         # Database schema
├── seed.ts               # Seed data (creates super admin)
└── migrations/           # Migration history
```

## API Routes

| Endpoint | Description |
|---|---|
| `/api/auth/login` | User login |
| `/api/auth/logout` | User logout |
| `/api/auth/me` | Current user info |
| `/api/auth/refresh` | Refresh JWT tokens |
| `/api/customers` | Customer CRUD |
| `/api/products` | Product CRUD |
| `/api/categories` | Category management |
| `/api/orders` | Order CRUD with approval workflow |
| `/api/damages` | Damage tracking |
| `/api/stock-in` | Stock intake |
| `/api/dashboard` | Dashboard metrics |
| `/api/users` | User management (admin) |

## Docker Deployment

Build and run with Docker (exposes port 4000):

```bash
docker build -t dlms .
docker run -p 4000:4000 --env-file .env dlms
```

The Dockerfile runs migrations automatically on startup and seeds the database after deployment.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run postdeploy` | Seed the database |
