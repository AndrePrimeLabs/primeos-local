# OpenClaw <-> Codex Task Bridge

This folder is the file-based contract between OpenClaw and Codex.

OpenClaw can create task JSON files in `inbox/`. Codex can pick them up,
move them to `active/`, and finish them in `done/` or `blocked/`.

## Folders

- `inbox/`: new tasks waiting for Codex.
- `active/`: task currently being handled.
- `done/`: completed tasks with result notes.
- `blocked/`: tasks that need human input or external state.

## Commands

```bash
npm run openclaw:create -- --title "Update docs" --summary "Create the missing docs"
npm run openclaw:list
npm run openclaw:show -- <task-id>
npm run openclaw:start -- <task-id>
npm run openclaw:complete -- <task-id> --summary "Finished the docs"
npm run openclaw:block -- <task-id> --summary "Need missing credentials"
```

## MCP Server

The same bridge is available as a local MCP stdio server:

```bash
npm run openclaw:mcp
```

Configured MCP server name:

```text
openclaw-codex
```

Tools:

- `openclaw_list_tasks`
- `openclaw_show_task`
- `openclaw_create_task`
- `openclaw_start_task`
- `openclaw_complete_task`
- `openclaw_block_task`

## Status Flow

```text
inbox -> active -> done
              \-> blocked
```

## Contract

Each task must follow `schema.json`.

The important fields are:

- `id`: stable task id.
- `title`: short task name.
- `status`: `pending`, `active`, `done`, or `blocked`.
- `kind`: `implementation`, `docs`, `review`, `research`, or `deploy`.
- `persona`: `clara`, `luzia`, `codex`, or `primeos`.
- `summary`: what should be done and why.
- `related_files`: optional local paths.
- `acceptance_criteria`: optional checklist.
- `results`: completion notes.
- `notes`: progress notes or blockers.
