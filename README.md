# Budget Tracker

A full‑stack personal finance app built with Next.js, TypeScript, Prisma, React Query, and Tailwind CSS.  
Users can securely track transactions, visualize spending by category, and view historical trends—all deployed serverlessly on Render.

[View the source on GitHub](https://github.com/rohankhatri7/budget-tracker)  
**Live Demo:** https://https://budget-tracker-py1o.onrender.com

---

## Features

- **Transaction Management**: Authenticated users can create, read, update, and delete transactions and categories  
- **Category Statistics**: Real‑time aggregation of spending by category, with bar and pie charts  
- **Historical Data**: Filterable date ranges to view spending trends over time  
- **Secure Authentication**: User sign‑up and login via Clerk  
- **Serverless Deployment**: Automatic builds and scaling on Render  

---

## Tech Stack

- **Framework**: Next.js 14 (App Router + API Routes)  
- **Language**: TypeScript  
- **ORM**: Prisma (SQLite locally → PostgreSQL in production)  
- **Data Fetching**: React Query for caching and synchronization  
- **Styling**: Tailwind CSS + Shadcn UI  
- **Auth**: Clerk  
- **Charts**: Recharts  
- **Deployment**: Render (serverless, PostgreSQL)  

---

## Getting Started

### Prerequisites

- Node.js ≥ 18  
- PostgreSQL (for local development)  
- A Clerk account (for auth credentials)  
- A Render account (to view or re-deploy the live app)

### Clone & Install

```bash
git clone https://github.com/rohankhatri7/budget-tracker.git
cd budget-tracker
npm install
# or
yarn install
# or
pnpm install
```

## Environment Variables
```bash
Create a .env.local in the project root with the following:
# Database (for production, PostgreSQL; local dev defaults to SQLite)
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/budget_db?schema=public"

# Clerk
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Run Locally
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
Open http://localhost:3000 to explore the app. Changes to app/ pages and API routes are hot‑reloaded.

## Deployment

This project is configured for zero‑config, serverless deployment on Render:

Connect your GitHub repo to Render as a Web Service.
Set the same environment variables on Render as in your .env.local.
Render will auto‑build on each push to main.
Live Demo: https://https://budget-tracker-py1o.onrender.com

## References

- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Clerk Authentication Docs**: https://clerk.dev/docs
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction
- **Prisma Docs**: https://prisma.io/docs
- **Recharts Documentation**: https://recharts.org
- **Render Web Services**: https://render.com/docs/web-services
