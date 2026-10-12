---
summary: The file formats of a project's docs/ folder, as Spriggs checks them, including portolan.yml and change entries.
covers:
  - packages/spriggs/src/docs/frontmatter.ts
  - packages/spriggs/src/docs/portolan.ts
  - packages/spriggs/src/docs/tree.ts
  - packages/spriggs/src/entry/writer.ts
---

# The docs contract

Each project keeps a `docs/` folder. Spriggs checks what it writes there against the rules below. The checks run inside the `write_doc` tool and again after the run.

## Layout

| Path | What it is | Who writes it |
| --- | --- | --- |
| `docs/portolan.yml` | Project metadata | People; Spriggs adds it if missing |
| `docs/overview.md` | What the project does, who owns it, how to call it | People and Spriggs |
| `docs/setup.md` | How to get a working copy running | People and Spriggs |
| `docs/changes/` | One change entry per pull request | Spriggs only |
| `docs/api/` | Specs made by the build | The build only; read-only for Spriggs |
| any other folder | Guides, reference, runbooks | People and Spriggs |

Spriggs writes only `.md`, `.yml` and `.html` files, at most two folders deep under `docs/` (so `docs/a/b/page.md` is fine and `docs/a/b/c/page.md` is not).

## Page frontmatter

Every markdown page outside `docs/changes/` starts with YAML frontmatter between `---` lines:

```yaml
---
summary: One or two sentences for a person.   # required, not empty
audience: agent                               # optional; the only allowed value
covers:                                       # optional list of code paths
  - packages/spriggs/src/run.ts
---
```

`covers` tells Spriggs which pages a change touches. A page is "affected" when one of its `covers` entries equals a changed path or is a folder that holds it. A trailing `/*` or `/**` is ignored, so `src/gate/**` matches anything under `src/gate/`. The model gets the affected pages as a hint; no model call is made to find them.

## portolan.yml

Only `name` is required. Spriggs keeps any other keys people add.

| Key | Type | Use |
| --- | --- | --- |
| `name` | string, required | Project name |
| `repo` | string | Repository address |
| `owner` | string | Owner |
| `issues.pattern` | regular expression | How to find issue ids in the title and description. Default `#123` style |
| `issues.url` | string | Issue tracker address |
| `chat.url` | string | Chat address |
| `specs` | list of strings | Spec files |

A file that does not parse, is not a mapping, has no `name`, or has a bad `issues.pattern` fails the check. A pull request run only warns about it at start.

## Change entries

Spriggs writes one entry per pull request under `docs/changes/`. If a file for the same pull request number exists, it is rewritten in place. A new file is named `<YYYY-MM-DD>-<slug>.md`. The slug is the title in lower case, words joined by `-`, cut near 50 characters at a word, with no trailing "the", "of" or similar. If that name is taken, `-<pr number>` is added.

Fields, in this order:

| Field | Value |
| --- | --- |
| `title` | One line, required |
| `kind` | `added`, `changed`, `fixed`, `removed`, `deprecated` or `internal` |
| `breaking` | `true`, only when the change is breaking |
| `pr` | Pull request number |
| `coverage` | `full` or `partial` |
| `reason` | `reason-missing` or `diff-too-large`, required when partial |
| `docs` | List of doc paths the change touched |

The body is two or three sentences from the model. A local run prints the entry instead of writing it. How the kind and coverage are chosen is in [pull-request-run.md](../spriggs/pull-request-run.md#kind-entry-and-label).
