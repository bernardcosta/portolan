import type { z } from "@hono/zod-openapi";
import type { Change, Project } from "./schemas";

type ProjectRow = z.infer<typeof Project> & { changes: z.infer<typeof Change>[] };

/** Fixture data in memory. A later version reads the publish payloads instead. */
export const projects: ProjectRow[] = [
  {
    name: "spriggs",
    repo: "bernardcosta/portolan",
    owner: "platform",
    summary: "A CI docs harness. Keeps docs/ accurate on every pull request.",
    docs: 3,
    changes: [
      {
        date: "2026-10-11",
        title: "Spriggs can create new explanation pages",
        kind: "added",
        pr: 7,
        coverage: "full",
      },
      {
        date: "2026-10-10",
        title: "Context-window error message and bounded context",
        kind: "fixed",
        pr: 4,
        coverage: "full",
      },
    ],
  },
  {
    name: "portolan",
    repo: "bernardcosta/portolan",
    owner: "platform",
    summary: "The hub that shows each project's docs, API playground and change feed.",
    docs: 0,
    changes: [],
  },
];

export const findProject = (name: string) => projects.find((p) => p.name === name);
