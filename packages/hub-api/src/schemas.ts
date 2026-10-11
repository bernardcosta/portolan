import { z } from "@hono/zod-openapi";

export const Project = z
  .object({
    name: z.string().openapi({ example: "spriggs" }),
    repo: z.string().openapi({ example: "bernardcosta/portolan" }),
    owner: z.string().openapi({ example: "platform" }),
    summary: z.string().openapi({ example: "A CI docs harness." }),
    docs: z.number().int().openapi({ description: "Number of pages under docs/", example: 3 }),
  })
  .openapi("Project");

export const Change = z
  .object({
    date: z.string().openapi({ description: "YYYY-MM-DD", example: "2026-10-11" }),
    title: z.string(),
    kind: z.enum(["added", "changed", "fixed", "removed", "deprecated", "internal"]),
    breaking: z.boolean().optional(),
    pr: z.number().int(),
    coverage: z.enum(["full", "partial"]),
  })
  .openapi("Change");

export const Health = z
  .object({ ok: z.literal(true), projects: z.number().int() })
  .openapi("Health");

export const NotFound = z.object({ error: z.string() }).openapi("NotFound");

export const ProjectName = z.object({
  name: z
    .string()
    .min(1)
    .openapi({ param: { name: "name", in: "path" }, example: "spriggs" }),
});

export const ChangesQuery = z.object({
  kind: Change.shape.kind.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});
