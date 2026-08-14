Copilot instructions — PrimeOsHub/primeos

Purpose
These notes help Copilot-style assistants (and humans using them) make correct, low-noise edits and run tasks in this repository. Read the root README, docs/PRIMEOS_APP.md and AGENTS.md for product context before changing domain logic.

1) Build, test, and lint commands (how to run)
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
  - Install & run dev: cd api-server && npm install && npm run dev
  - Start production: cd api-server && npm start

- Agent server (local Clara wrapper)
  - Python requirements: python3 -m venv .venv && source .venv/bin/activate && pip install -r agent-server/requirements.txt
  - Run: python3 agent-server/app.py
  - Or build via Dockerfile.agent for Jetson: docker build -f Dockerfile.agent -t primeos-agent .

- Compose / Docker (VPS / local)
  - Build and run compose (local build): docker compose -f docker-compose.vps.yml up -d --build
  - Registry/pull-based compose: docker compose -f docker-compose.registry.yml pull && docker compose -f docker-compose.registry.yml up -d
  - Single image build (frontend): docker build -f Dockerfile -t primeos-frontend:local .

- Tests
  - Vitest is available (devDependency). To run the full test suite if configured:
    npx vitest
  - Run a single test file (example):
    npx vitest run path/to/test/file.test.js
  - Run tests matching a pattern:
    npx vitest -t "pattern"

- DB schema / migrations
  - Schema files live under database/ (schema.sql and organized schema/*). Apply via psql inside the Postgres container or use scripts/vps-setup-complete.sh which automates apply + key generation.

2) High-level architecture (what to know)
- Frontend: src/ (Vite + React). Public build produced by vite build → dist → served by Nginx in the Docker image or deployed via FTP to Hostinger.
- Server-side: two forms
  - Vercel serverless functions in api/ (used for fast endpoints and Hostinger API wrappers). These expect header x-primeos-key for internal endpoints.
  - Long-running API service scaffold in api-server/ (Express) used for BAAS-style endpoints; runs on port 3000 by default in Docker compose.
- Database: Postgres for persistent data. Schema and migrations under database/; seeds in database/seeds/.
- Deployment targets
  - Hostinger (shared): static site via FTP and Docker service for backend (Traefik + Docker). Docker compose files: docker-compose.vps.yml (build-on-host) and docker-compose.registry.yml (pull images from GHCR).
  - Jetson/Palit Pandora: local model inference — Dockerfile.agent and docker-compose.agent.yml provided to run Clara LLM wrapper on device (arm64/CUDA). Agent-server (FastAPI wrapper) exposes /generate and /push-result.
- Agents & orchestration
  - Agents live under agents/ and follow the NemoClaw/OpenClaw conventions. Each agent is scaffolded with 10 "body parts" (interface, perception, memory, knowledge, reasoning, planning, executor, safety, telemetry, ops). Use scripts/generate_agent.js to scaffold new agents.
  - Agent scaffolds often run as containers and communicate with the backend via /agent/submit protected by x-primeos-key.
- CI / Images
  - GitHub Actions workflow .github/workflows/publish-images.yml builds and publishes GHCR images for frontend, API, and agent (arm64). Use GHCR_PAT in repository secrets to enable publishing.
- Utilities & SDKs
  - Local SDKs provided in sdk/node and sdk/python for agents and integration.
  - Handy ops helpers: scripts/primeosctl (ssh/sync/start/logs), scripts/vps-setup-complete.sh (bootstrap + schema + key insertion), scripts/deploy.mjs (FTP deploy)

3) Key conventions and repository-specific patterns
- Environment variables
  - Frontend must use VITE_* prefix for any variable consumed by the browser. Server-only secrets belong in .env (gitignored) or in CI secrets.
  - Hostinger endpoints and some internal calls require header: x-primeos-key: <PRIMEOS_API_KEY>

- Docker & Traefik labels
  - Compose services are attached to an external Docker network called traefik by default. Traefik router labels in docker-compose.*.yml use entrypoint websecure and TLS via Traefik's ACME setup.
  - When adding services, follow existing label patterns: traefik.enable, traefik.http.routers.<name>.rule=Host(`host`), traefik.docker.network=traefik, traefik.http.services.<name>.loadbalancer.server.port=<container-port>

- Agents (NemoClaw) structure
  - Each agent uses a manifest.json and an index.js entry that runs bodyparts in order. Bodypart modules are small JS files under agents/<agent>/bodyparts/<part>/.
  - Use scripts/generate_agent.js to create standard scaffolds.

- Database and migrations
  - Prefer database/ directory for authoritative schema, migrations, and seeds rather than legacy folders.
  - Use scripts/vps-setup-complete.sh to apply schema in an automated VPS flow; otherwise apply SQL via psql inside the db container.

- Commits and collaboration
  - Repository scripts and developer policy expect commits to include a Co-authored-by trailer for automated commits generated via Copilot tooling. Example trailer used in this repo:
    Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  - When making change suggestions, ensure the assistant does not auto-commit secrets or developer tokens.

- OpenClaw / AI agent metadata
  - There is an .openclaw folder with AGENTS.md and BOOTSTRAP.md used by OpenClaw runtime. Do not modify .openclaw/AGENTS.md unless asked; treat it as runtime metadata.

- Script safety and interactivity
  - Many scripts assume interactive or secure input (e.g., ssh-copy-id, scp, or prompts for API tokens). Avoid writing scripts that embed plaintext credentials.

4) Files and docs to consult first (priority order)
- README.md (root) — quick start, scripts, build and deploy notes
- docs/PRIMEOS_APP.md — product architecture, entities, and important file pointers
- AGENTS.md and .openclaw/AGENTS.md — agent conventions and runtime metadata
- DEPLOY.md — step-by-step host/VPS deployment and bootstrap notes
- .github/workflows/* — CI and image publishing examples
- database/schema.sql and database/ (migrations) — DB contract and migration locations
- scripts/ and agent-server/ — operational scripts and agent runtime glue

5) How to run targeted tasks (examples)
- Run a single lint on file: npx eslint src/components/ui/Button.jsx --quiet
- Run a single test file: npx vitest run src/__tests__/some-test.spec.ts
- Start only the API locally: (cd api-server && npm run dev)
- Build and push images (locally) and then deploy on VPS (pull-based):
  docker build -f Dockerfile.api -t ghcr.io/PrimeOsHub/primeos-api:latest .
  docker push ghcr.io/PrimeOsHub/primeos-api:latest
  # on VPS: docker compose -f docker-compose.registry.yml pull && docker compose -f docker-compose.registry.yml up -d

6) AI assistant / Copilot-specific guidance
- Before code changes, read docs/PRIMEOS_APP.md and AGENTS.md to understand domain concepts and agent conventions.
- When suggesting edits to API surface: preserve x-primeos-key header validation and Hostinger integration endpoints in api/hostinger.
- For agent work, prefer using scripts/generate_agent.js to scaffold and follow the 10 bodyparts pattern.
- Do not propose or inject secrets; use .env.example and reference secrets by name.
- If proposing a new long-running service, include Traefik label examples and add the service to docker-compose.registry.yml or docker-compose.vps.yml per existing patterns.

7) Cross-check for other AI config files
- There are internal agent skill references under .agents and .openclaw — consult them for additional instructions and capabilities.
- If you find other assistant config files (CLAUDE.md, AGENTS.md, CONVENTIONS.md, etc.), incorporate their authoritative instructions into suggestions.

MCP Servers
Would you like help configuring any MCP servers (e.g., Playwright test runner, a browser-based headless test server, or CI-deployed test runners) for this repository? If yes, specify which service(s) to configure and I will prepare the recommended MCP configuration.

Summary
Created .github/copilot-instructions.md containing build/test/lint commands, high-level architecture notes, and repository-specific conventions (agents, Traefik, x-primeos-key, DB migrations, SDKs, and script usage).

Want any additions (for example: a short checklist for reviewing PRs, or automatic Dependabot/patching instructions)?
