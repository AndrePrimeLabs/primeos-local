# OpenClaw Bootstrap for PrimeOS

This repository is already configured as an OpenClaw workspace using the `.openclaw` folder.

## What is included

- `.openclaw/AGENTS.md` — workspace guidance and agent conventions
- `.openclaw/IDENTITY.md` — current agent identity metadata
- `.openclaw/USER.md` — context about the user and business needs
- `.openclaw/PRIME_ODONTOLOGIA_CLARA.md` — Clara persona for Prime Odontologia
- `.openclaw/GOVERNMENT_PRIMEOS_LUZIA.md` — Luzia persona for the PrimeOS App Hub
- `.openclaw/workspace-state.json` — OpenClaw workspace state

## PrimeOS integration

The PrimeOS app uses `functions/aiChatbot.ts` as the AI backend, and `src/components/ai/AIChatbot.jsx` now supports two personas:

- `clara` — Prime Odontologia customer relationship agent
- `luzia` — Government of PrimeOS App Hub agent

To keep OpenClaw aligned with PrimeOS:

1. Keep `.openclaw/GOVERNMENT_PRIMEOS_LUZIA.md` updated with Luzia persona and scope.
2. Keep `.openclaw/PRIME_ODONTOLOGIA_CLARA.md` updated with Clara persona details.
3. Keep `.openclaw/USER.md` updated with PrimeOS business context and any relevant operating constraints.
4. Ensure `.mcp.json` is present and valid for MCP integration with Hostinger.

## Running locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with your app env vars.
3. Start the dev server:

   ```bash
   npm run dev
   ```

## Notes

- If you use OpenClaw tooling, open the repo root and point the tool at this workspace.
- Use the `.openclaw` files as the source of truth for agent/persona documentation and integration guidance.
- OpenClaw session URL for this workspace: [https://openclaw-cmrt.srv1204869.hstgr.cloud/chat?session=main](https://openclaw-cmrt.srv1204869.hstgr.cloud/chat?session=main).
- Do not store or publish sensitive tokens in repo files; keep them private.
- If you need to expand PrimeOS integration, add new OpenClaw persona files under `.openclaw/` and update `src/components/ai/AIChatbot.jsx` accordingly.
