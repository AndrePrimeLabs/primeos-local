# PrimeOS Database Repository

Version-controlled Postgres schema for Supabase project `foeahubnrbclbelsqikp`.

## Directory layout

```
database/
├── config/             # Environment profiles and execution manifests
├── migrations/         # Incremental, ordered changes (Flyway-style)
├── schema/             # State-based blueprints (full object definitions)
│   ├── tables/
│   ├── views/
│   ├── functions/
│   └── procedures/
├── seeds/              # Reference and environment-specific data
│   ├── dev/
│   └── prod/
└── scripts/            # CI/CD and DBA utilities
```

## Execution order (pipelines)

Run steps in this order for a **greenfield** environment:

| Step | Path | Purpose |
|------|------|---------|
| 1 | `config/environments.json` | Resolve target env (`dev` \| `staging` \| `prod`) |
| 2 | `schema/` via `npm run db:schema` | Apply full table/view/function/procedure blueprints |
| 3 | `migrations/` via `npm run db:migrate` | Apply incremental versioned changes |
| 4 | `seeds/{env}/` via `npm run db:seed` | Load reference or mock data |

For **existing** databases that already ran `supabase/migrations/`, use only `migrations/` for new deltas and `seeds/` as needed.

## Environment variables

Copy `config/*.env.example` to `.env.local` at the repo root (already gitignored):

- `DATABASE_URL` — direct Postgres (migrations, seeds, scripts)
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — app client

## Commands

```bash
# Apply schema blueprints (tables → views → functions → procedures)
npm run db:schema -- --env dev

# Run incremental migrations (V1, V2, …)
npm run db:migrate -- --env dev

# Load seeds for an environment
npm run db:seed -- --env dev

# Dev reset: schema + migrations + dev seeds (destructive)
npm run db:reset-dev
```

Requires `DATABASE_URL` and optionally `psql` on PATH. Without `psql`, the script prints the exact files to run manually.

## Migration naming

`V{version}__{description}.sql` — versions sort lexicographically (`V10` after `V9`; pad with zeros if needed: `V09`).

## Legacy

Historical bulk scripts live under `supabase/migrations/`. New work belongs in `database/` only.
