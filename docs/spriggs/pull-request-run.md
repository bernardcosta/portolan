---
summary: The steps of one Spriggs run on a pull request, from reading the context to posting the result, and the code host layer behind it.
covers:
  - packages/spriggs/src/run.ts
  - packages/spriggs/src/gate/signals.ts
  - packages/spriggs/src/gate/decide.ts
  - packages/spriggs/src/enforce.ts
  - packages/spriggs/src/forge/types.ts
  - packages/spriggs/src/forge/github.ts
  - packages/spriggs/src/forge/local.ts
---

# A pull request run

`bun run spriggs run` (or the action with `command: run`) calls `run()` in `packages/spriggs/src/run.ts`. The steps, in order:

1. **Context.** The code host gives the pull request, its commits, the changed files and the diff (see [Code hosts](#code-hosts)).
2. **Config.** `docs/portolan.yml` is loaded. A broken file only prints a warning.
3. **Signals.** A plain script reads facts, with no model (see [Signals](#signals)).
4. **Skip rules.** Some runs stop here with exit code 0 and post nothing.
5. **Drift check.** If the description is the same as last run but the head moved, the comment gets a **Heads up** note. It never blocks.
6. **Gate.** Rules decide `proceed`, `partial` or `abstain`.
7. **Agent.** The model reads the change and edits `docs/` with its tools (see [agent.md](agent.md)).
8. **Post-run check.** Every file the model wrote is checked again.
9. **Change entry.** Spriggs writes `docs/changes/<file>.md` itself.
10. **Commit and push** of `docs/` to the pull request branch.
11. **Report.** One sticky comment, one `docs:*` label, one `spriggs` commit status.

If any step after the gate fails, Spriggs puts back every file the model wrote, then reports `docs:needs-input` with a `failure` status.

## Signals

`gate/signals.ts` reads:

- whether the description has a **Why** section (text under a heading named "Why", HTML comments left out), and its word count;
- the Conventional Commits type (`type(scope)!: subject`) from the title, or else the first commit subject that has one;
- whether the change is breaking (a `!` after the type, or a line starting with `BREAKING CHANGE:` or `BREAKING-CHANGE:` in the description or a commit body);
- issue ids, with the default pattern `#123` or `issues.pattern` from `portolan.yml`;
- the changed lines, with lockfiles and other generated files left out (`*.lock`, `package-lock.json`, `pnpm-lock.yaml`, `go.sum`, `Cargo.lock` and similar);
- whether paths touch an API, a schema or config, or only `docs/`;
- whether the head commit is Spriggs's own, and whether the pull request comes from a fork or Dependabot.

The type maps to a change kind: `feat` → added, `fix` → fixed, `perf` → changed, and `refactor`, `chore`, `ci`, `build`, `test`, `style`, `docs` → internal.

## Skip rules

`skipReason()` in `gate/decide.ts` skips a run when:

- the pull request is from a fork or Dependabot;
- the head branch is the default branch (in CI);
- there are no changed files, or only files under `docs/` changed;
- the event is a description edit, and the body did not change, or the pull request has neither `docs:needs-input` nor `docs:partial`;
- the head commit is Spriggs's own (in CI only; a local run goes ahead).

## Gate

`decide()` uses rules only:

| Case | Verdict |
| --- | --- |
| Over the line limit (5,000, or `SPRIGGS_MAX_LINES`) | abstain, `too-large` |
| Reason given, up to 1,500 lines | proceed, small |
| Reason given, over 1,500 lines | proceed, large |
| No reason, up to 1,500 lines | partial, `reason-missing` |
| No reason, over 1,500 lines | abstain, `reason-missing` |

A reason is a non-empty **Why** section or a description of 20 words or more. The small and large tiers pick the agent budget. An abstain posts `docs:needs-input` and does not call the model.

## Post-run check

`enforce()` in `enforce.ts` looks at each file the model wrote. A file written back with its old content does not count. It fails the run when:

- a file is outside `docs/`, or under `docs/api/` or `docs/changes/`;
- a markdown page has bad frontmatter, or `portolan.yml` does not parse (see [docs contract](../reference/docs-contract.md));
- the docs edits add up to more than 1,500 changed lines (no cap for `init`);
- in CI, `git status` shows a changed file the model did not write.

## Kind, entry and label

The entry's kind comes from the commit type when there is one. The model's kind is used only when there is no type, or to narrow `added` to `changed`. A model answer of `unknown` becomes `changed`. An `internal` change gets no entry unless the model sets `large_refactor`.

The run is partial when the gate said partial, or when some changed files (generated files left out) were never seen by the model. Then the entry has `coverage: partial` with the reason `reason-missing` or `diff-too-large`.

| Result | Label |
| --- | --- |
| Docs or entry written, full | `docs:done` |
| Docs or entry written, partial | `docs:partial` |
| Nothing written, partial | `docs:partial` |
| Nothing written, no entry needed | `docs:none` |
| Gate abstained, or the run failed | `docs:needs-input` |

The docs commit message is `docs: <title>`, cut to one line of at most 72 characters. If the push is rejected because the branch moved during the run, the run logs `superseded` and stops with exit code 0. The newer push starts its own run.

## Code hosts

`run()` never talks to GitHub directly. It uses the `Forge` interface in `forge/types.ts`: `getContext`, `previousRun`, `upsertComment`, `setLabel`, `setStatus` and `commitAndPush`.

- **`GitHubForge`** (`forge/github.ts`) needs `GITHUB_TOKEN` and `GITHUB_EVENT_PATH`, and reads a `pull_request` event. The diff is `base...head`. The sticky comment starts with a hidden marker `<!-- spriggs body=<hash> head=<sha> -->`; the next run reads it for the drift check. Only a comment by Spriggs's own bot user counts. Before it sets a label, it reads the current labels and removes the other `docs:*` ones. It commits only `docs/`, with git hooks turned off, and passes the token to `git push` for that one command only. With `SPRIGGS_APP_SLUG` set, it commits as the App's bot user.
- **`LocalForge`** (`forge/local.ts`), for `--local --base <ref>`. The diff is the working tree, untracked files included, against the merge-base with `<ref>`. `--reason` becomes a description with a **Why** section. The comment, label and status are printed. Nothing is committed.

How to run either one, and what the comment looks like, is in [setup.md](../setup.md).
