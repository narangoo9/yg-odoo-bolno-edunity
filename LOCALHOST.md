# Localhost Setup

This project is now configured to use local PostgreSQL by default instead of Neon.

## Default local services

```env
DATABASE_URL="postgresql://elearn:elearn_password@localhost:15432/elearn_db"
DIRECT_URL="postgresql://elearn:elearn_password@localhost:15432/elearn_db"
REDIS_URL="redis://localhost:16379"
```

## Safe daily start

Use this command for normal local development:

```bash
npm run dev:safe
```

It starts Postgres and Redis, generates Prisma Client, seeds demo data if the database is empty, creates a SQL backup when data exists, and then starts Next.js.

Backups are saved in `backups/`.

## Manual start dependencies

```bash
docker compose up -d postgres redis
```

## Prepare the database

```bash
npm run db:generate
npm run db:seed
```

If `npm run db:migrate` fails with a Prisma `EPERM` error in this Windows/OneDrive workspace, apply the checked-in SQL migrations through the Postgres container instead:

```powershell
$dirs = Get-ChildItem 'prisma/migrations' -Directory | Sort-Object Name
foreach ($d in $dirs) {
  Get-Content -Raw (Join-Path $d.FullName 'migration.sql') | docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U elearn -d elearn_db
}
```

## Start the app

```bash
npm run dev
```

Do not run `docker compose down -v` unless you intentionally want to delete the local database volume.
