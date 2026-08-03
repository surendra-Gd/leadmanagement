# Infotechs Lead Management System

A responsive internal lead-management web app for Infotechs, built with Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style components, and Supabase Auth/PostgreSQL persistence.

## Features

- Dashboard cards for total, confirmed, not confirmed, in progress, completed, and cancelled leads.
- Financial overview for project value, received amount, pending amount, average value, and conversion rate.
- Monthly revenue and completed-project charts.
- Lead CRUD with search, status/date/amount filters, and sorting.
- Status workflow for not confirmed, confirmed, in progress, completed, and cancelled.
- Lead detail pages with customer info, project info, payment summary, notes, activity timeline, edit, delete, and status controls.
- Completed and cancelled lead pages with locked status filters.
- Responsive sidebar/top navigation, dark mode, toasts, empty states, and confirmation before delete.
- Supabase Auth with protected middleware when environment variables are present.
- Supabase-backed lead, payment, note, timeline, status, and soft-delete persistence.
- PostgreSQL schema with UUID keys, foreign keys, timestamps, soft delete, payment summary view, and RLS policies.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app runs in live Supabase mode when `.env.local` has Supabase keys. If keys are missing, it falls back to demo mode and stores sample lead data in browser local storage.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Create users manually in Supabase Auth.
4. Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart the dev server.

## Project Structure

```text
src/app                 App Router pages and layouts
src/components          App views and reusable UI primitives
src/lib                 Types, analytics, store, utilities, Supabase clients
supabase/schema.sql     Database schema and RLS policies
```

The app writes lead data to Supabase when environment variables are configured. Demo mode remains available only as a local fallback.
