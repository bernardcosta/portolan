---
summary: hub-api is the read-only HTTP API of the Portolan hub. It lists projects and serves each project's change feed. For now it serves fixture data held in memory.
covers:
  - packages/hub-api/src/app.ts
  - packages/hub-api/src/schemas.ts
  - packages/hub-api/src/data.ts
  - packages/hub-api/src/index.ts
  - packages/hub-api/scripts/openapi.ts
  - packages/hub-api/package.json
---

# hub-api

`packages/hub-api` is a small read-only REST API for the Portolan hub. The hub web app and agents use it to list projects and read change feeds. It is built with Hono, and the route schemas are written with zod. The OpenAPI document is generated from those schemas, so the routes and the document always agree.

This is the first version. The data is a fixed list of two projects (`spriggs` and `portolan`) held in memory. There is no database, and nothing is read from the projects' `docs/` folders yet.

## Run it

From `packages/hub-api`:

```
bun run dev
```

This starts the server with Bun in watch mode on `http://localhost:8787`. Set `PORT` to use another port.

## Routes

All routes are `GET` and return JSON.

| Route | Returns |
| --- | --- |
| `/health` | `{ "ok": true, "projects": <count> }` |
| `/projects` | Every project, in registration order |
| `/projects/{name}` | One project, or 404 |
| `/projects/{name}/changes` | The project's change entries, newest first, or 404 |
| `/openapi.json` | The OpenAPI 3.1 document |

A project has `name`, `repo`, `owner`, `summary` and `docs` (the number of pages under `docs/`).

A change entry has `date` (`YYYY-MM-DD`), `title`, `kind`, `pr`, `coverage` (`full` or `partial`) and, when set, `breaking`.

`/projects/{name}/changes` takes two optional query parameters:

- `kind`: only entries of this kind. One of `added`, `changed`, `fixed`, `removed`, `deprecated`, `internal`.
- `limit`: how many entries to return, from 1 to 100. Default 20. Values outside that range are rejected.

An unknown project name returns status 404 with `{ "error": "project not found" }`.

## OpenAPI document

`GET /openapi.json` serves the document from the running server. The same document is committed to `docs/api/openapi.json` so Spriggs and the hub can read it without a server. After any route or schema change, regenerate it from `packages/hub-api`:

```
bun run openapi
```

Commit the updated `docs/api/openapi.json` with the change. Do not edit that file by hand.
