# Legacy Supabase migrations

Bulk historical scripts (`001_create_tables.sql`, etc.) remain here for reference.

**New database work** lives in [`../../database/`](../../database/README.md):

- `database/schema/` — state-based blueprints
- `database/migrations/` — versioned incremental changes (`V1__…`, `V2__…`)
- `database/seeds/` — `dev/` and `prod/` data
- `database/scripts/` — CI/CD runners

Use `npm run db:migrate` from the repo root.
