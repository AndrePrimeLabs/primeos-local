# Copilot instructions — PrimeOsHub/primeos

Purpose
These notes help Copilot-style assistants (and humans) make correct, low-noise edits and run tasks in this repository. They consolidate actionable commands, architecture context, and repository-specific rules from README.md, docs/PRIMEOS_APP.md, AGENTS.md, CLAUDE.md and .openclaw/AGENTS.md.

1) Build, test, and lint (practical commands)
- Install dependencies (root):
  npm install

- Frontend (Vite + React)
  - Dev server: npm run dev
  - Build: npm run build
  - Preview: npm run preview
  - Lint (whole repo): npm run lint
  - Lint a single file: npx eslint path/to/file.js --quiet
  - Typecheck: npm run typecheck

- API server (api-server folder)
  - Dev: cd api-server && npm install && npm run dev
  - Prod start: cd api-server && npm start

- Agent server (local Clara wrapper)
  - Setup: python3 -m venv .venv && source .venv/bin/activate && pip install -r agent-server/requirements.txt
  - Run: python3 agent-server/app.py
  - Build (Jetson): docker build -f Dockerfile.agent -t primeos-agent .

- Docker / Compose
  - Local (build & up): docker compose -f docker-compose.vps.yml up -d --build
  - Pull-based (VPS): docker compose -f docker-compose.registry.yml pull && docker compose -f docker-compose.registry.yml up -d
  - Build image (frontend): docker build -f Dockerfile -t primeos-frontend:local .

- Tests (Vitest)
  - Run full suite: npx vitest
  - Run a single file: npx vitest run path/to/test/file.test.js
  - Run tests by name: npx vitest -t "pattern"

- DB schema / migrations
  - Schema under database/ (schema/tables, views, functions, migrations, seeds).
  - Apply migrations via psql inside the Postgres container or scripts/vps-setup-complete.sh.

2) High-level architecture (quick map)
- Frontend: src/ — Vite + React. App entry and providers in src/App.jsx; pages auto-registered via src/pages.config.js.
- Server-side:
  - api/ — Vercel-compatible serverless functions (small fast endpoints). Many hostinger-related endpoints live under api/hostinger and require x-primeos-key.
  - api-server/ — optional long-running Express API used in compose deployments (port 3000 by default).
- Agents & inference: agents/ follow NemoClaw/OpenClaw conventions (10 bodyparts). scripts/generate_agent.js scaffolds agents. Agent runtime helpers and local Clara wrapper live under agent-server/.
- Database: Postgres. Authoritative schema and migrations in database/. Prefer this folder for any DB work.
- Deploy targets: Hostinger (FTP for static assets + Docker/Traefik for services), optional Firebase and Docker images pushed to GHCR via GitHub Actions.

3) Key repository conventions (must-follow)
- Environment variables
  - Frontend must only use VITE_* for browser-visible vars (Vite rule).
  - Server/Vercel secrets live in .env (gitignored) or CI secrets.
  - Hostinger & internal API requirement: include header x-primeos-key: <PRIMEOS_API_KEY> on protected endpoints.

- Deploy & Hostinger
  - Static deploy happens via scripts/deploy.mjs (FTP). Use npm run deploy or npm run deploy:hostinger. Do not hardcode FTP credentials in code.
  - Hostinger API client: api/_lib/hostinger.js (server-side only).

- Docker & Traefik
  - When adding services, attach to external traefik network and copy existing label patterns (traefik.enable, traefik.http.routers.<name>.rule=Host(`...`), etc.).

- Agents
  - Agent scaffold: scripts/generate_agent.js. Agent bodyparts run in specific order; packaging and manifests are required for containerized agents.

- Data & SDK usage
  - Use the internal primeosClient (src/api/primeosClient.js) for entity reads/writes and function invocations rather than ad-hoc DB calls when possible.
  - Prefer database/ for schema changes; avoid editing legacy copies in data/ or database-repo/.

- Commits
  - Automated commits created by Copilot tooling should include this trailer:
    Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  - Do NOT commit secrets or personal tokens.

- Script safety
  - Many scripts expect interactive input — do not bake credentials into scripts. Avoid destructive commands without explicit user consent.

4) AI assistant-specific guidance (do this before acting)
- Read docs/PRIMEOS_APP.md and AGENTS.md for domain context before changing domain logic.
- Respect .openclaw/AGENTS.md memory and red-line rules:
  - Do not exfiltrate private data.
  - Do not run destructive commands without asking.
  - Use memory files (memory/YYYY-MM-DD.md and MEMORY.md) per policy.
- Do not propose or inject secrets; prefer referencing .env.example and instructing the user to set secrets in CI/host environment.
- When asked about Copilot CLI capabilities, fetch the authoritative copilot-cli documentation via the fetch_copilot_cli_documentation tool first (see self-documentation policy).

5) Files to consult (priority order)
1. README.md (root)
2. docs/PRIMEOS_APP.md
3. AGENTS.md and .openclaw/AGENTS.md
4. scripts/deploy.mjs and scripts/vps-setup-complete.sh
5. database/ (schema and migrations)
6. api/hostinger/* and api/_lib/hostinger.js
7. src/api/primeosClient.js and src/pages.config.js

6) Other assistant config files
- CLAUDE.md, AGENTS.md, .openclaw/AGENTS.md are present and contain environment & agent rules — consult them before making agent-related changes.
- If you find other assistant configs (CONVENTIONS.md, AIDER_CONVENTIONS.md, .cursorrules, .windsurfrules, .clinerules, .cursor/rules/), incorporate their authoritative instructions into your changes.

7) Quick examples (copy-paste)
- Run single test file: npx vitest run path/to/test/file.test.js
- Lint single file: npx eslint src/components/ui/Button.jsx --quiet
- Start only API: (cd api-server && npm run dev)
- Deploy: npm run deploy (build + scripts/deploy.mjs)

8) MCP servers
If you want help configuring MCP servers commonly used with web projects (example: Playwright test runner, headless browser runners, or CI-deployed test runners), ask and a recommended configuration will be prepared.

Summary
Suggested consolidated Copilot instructions that combine actionable commands, architecture map, and agent safety/memory rules. To apply this suggestion and replace the existing .github/copilot-instructions.md, reply "apply" and the file will be updated in place.