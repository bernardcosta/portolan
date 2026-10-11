---
summary: Portolan keeps a repo's docs accurate on every pull request and publishes them to one hub for people and agents.
---

# Overview

Portolan is a doc harness. It has two parts.

**Spriggs** is a documentation agent that runs in CI on every pull request. It reads the diff, the pull request description and the commit messages. A gate decides whether there is enough information to write docs. When there is, Spriggs updates the `/docs` folder, writes a change entry and commits to the pull request branch. The reviewer sees the doc changes beside the code. When there is not, Spriggs says so on the pull request and does not guess. Each run posts one sticky comment, sets one `docs:*` label and a `spriggs` commit status.

**Portolan** is a self-hosted hub. It shows every project's docs, API playground and change feed at one address. People read it in a browser. Agents read it over MCP.

The repo is the source of truth. Each project keeps a `/docs` folder with a small fixed spine: `portolan.yml`, `overview.md`, `setup.md`, `changes/` and `api/`. Portolan only displays what is in git.

## Status

Early development. Spriggs is built first and runs on this repo's own pull requests. Portolan comes later. Its first piece, `hub-api`, is a read-only REST API that lists projects and their change feeds. For now it serves fixture data held in memory. See [the hub API guide](guides/hub-api.md).

## How to call it

Local run: `bun run spriggs run --local --base <ref>`. In CI: the `spriggs.yml` workflow runs `bun run spriggs run` (the `portolan spriggs run` CLI) on each pull request. See [setup.md](setup.md).

The hub API: `bun run dev` in `packages/hub-api`, then `GET http://localhost:8787/projects`. Its OpenAPI document is in `docs/api/openapi.json`.

## Owner

bernardcosta.
