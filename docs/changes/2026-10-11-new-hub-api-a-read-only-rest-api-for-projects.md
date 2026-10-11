---
title: "New hub-api: a read-only REST API for projects and change feeds"
kind: added
pr: 8
coverage: full
docs:
  - docs/guides/hub-api.md
  - docs/setup.md
  - docs/overview.md
---

The hub now has a read-only HTTP API in packages/hub-api. It lists projects and each project's change feed, which you can filter by kind and limit. For now it serves fixture data held in memory. Its OpenAPI document is generated with `bun run openapi` and committed to docs/api/openapi.json. Nobody needs to do anything. If you change a route, run `bun run openapi` again and commit the result.
