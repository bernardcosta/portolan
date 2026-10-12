---
summary: How Spriggs drives a model, what tools the model gets, and how providers plug in. For people changing the agent code.
audience: agent
covers:
  - packages/spriggs/src/agent/agents.ts
  - packages/spriggs/src/agent/loop.ts
  - packages/spriggs/src/agent/tools.ts
  - packages/spriggs/src/agent/model.ts
  - packages/spriggs/src/agent/providers/types.ts
  - packages/spriggs/src/agent/providers/anthropic.ts
  - packages/spriggs/src/agent/providers/openai.ts
---

# The agent

The code in `packages/spriggs/src/agent/` turns a model into a doc writer. It has four parts: the agents, the loop, the tools and the providers.

## Agents

An agent (`agents.ts`) is a system prompt, a list of tools taken from the pool, and a budget. There are two.

| Agent | Used by | Tools | Budget |
| --- | --- | --- | --- |
| `docs` (small) | pull request runs up to 1,500 lines | `list_files`, `read_file`, `read_diff`, `write_doc`, `finish` | 30 turns, 600,000 tokens, 10 minutes |
| `docs` (large) | pull request runs over 1,500 lines | same | 40 turns, 1,500,000 tokens, 15 minutes |
| `init` | `spriggs init` | `list_files`, `search`, `read_file`, `write_doc`, `finish` | 120 turns, 2,000,000 tokens (`SPRIGGS_INIT_TOKENS`), 45 minutes |

Tokens are input not served from the provider's cache, plus output. The system prompts are in `prompt.ts` (pull request) and `init-prompt.ts` (cold start). The first user message is built by `buildUserMessage()` and `buildInitMessage()` in the same files.

## The loop

`runAgent()` in `loop.ts` repeats: send the history to the model, run its tool calls, add the results, until the model calls `finish` or a budget runs out. Along the way it:

- stops with an error when time or tokens run out, or when it hits the turn limit;
- for an agent with a wrap-up message (only `init`), sends it once when 80% of turns, tokens or time is spent;
- caps each reply at 32,000 output tokens; a reply cut at that limit runs none of its tool calls and gets one retry with advice to write less;
- nudges the model once when it stops without calling `finish`, and fails on the second time;
- refuses a tool the agent does not have;
- tracks which changed files the model saw (inline, or by a full `read_diff` or `read_file`), and refuses the first `finish` if files that were not shown inline are still unread;
- clears the content of tool results older than the last three tool turns once a request goes over `SPRIGGS_CONTEXT_TOKENS` input tokens (default 600,000).

## Tools

The tool pool in `tools.ts` is the safety boundary. The model has no shell and no network, only these tools:

| Tool | Does |
| --- | --- |
| `list_files` | Lists readable files under a folder |
| `search` | `git grep -E` over tracked files; skips binary and generated files; at most 200 lines, each cut at 300 characters |
| `read_file` | Reads a tracked or changed file, up to 64 KB per call, by start line and line count. Refuses symlinks and paths outside the repo |
| `read_diff` | The diff of one changed file, cut at 64 KB (a cut diff does not count as read) |
| `write_doc` | Writes one file under `docs/` (rules below) |
| `finish` | Ends the run with `title`, `kind`, `body`, `docs`, `notes` and `large_refactor` |

`write_doc` refuses a path outside `docs/`, under `docs/api/` or `docs/changes/`, a type other than `.md`, `.yml` or `.html`, a path more than two folders deep, content over 80,000 characters, a path that resolves outside `docs/` through a symlink, and content that fails the [docs contract](../reference/docs-contract.md). It remembers each file's content before the first write, so a failed run can put it back and the post-run check knows what was written.

Readable files are the files git tracks, plus the changed files of the run. For `init`, untracked files that git does not ignore are readable too.

## Providers

`resolveProvider()` in `model.ts` turns `provider/model` into a `Provider`. The model comes from the `--model` flag, then `SPRIGGS_MODEL`, then `anthropic/claude-opus-5-5` when `ANTHROPIC_API_KEY` is set. It fails before any network call when the model or its key is missing.

| Prefix | Class | Key |
| --- | --- | --- |
| `anthropic/` | `AnthropicProvider` | `ANTHROPIC_API_KEY` |
| `openai/` | `OpenAIProvider` | `OPENAI_API_KEY` |
| `openrouter/` | `OpenAIProvider` with base address `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |

A provider implements one method, `complete()`, over the shapes in `providers/types.ts`: turns, tool definitions, tool calls and usage (input, output and cached tokens). The assistant's raw reply is kept and sent back unchanged on the next request. A request larger than the model's window raises `ContextWindowError`; nothing is cut. To add a provider, implement `Provider` and add a case to `resolveSpec()`.
