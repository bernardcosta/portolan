import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { findProject, projects } from "./data";
import { Change, ChangesQuery, Health, NotFound, Project, ProjectName } from "./schemas";

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

export const app = new OpenAPIHono();

app.openapi(
  createRoute({
    method: "get",
    path: "/health",
    summary: "Liveness check",
    responses: { 200: json(Health, "The service is up") },
  }),
  (c) => c.json({ ok: true as const, projects: projects.length }, 200),
);

app.openapi(
  createRoute({
    method: "get",
    path: "/projects",
    summary: "List every project the hub knows",
    responses: { 200: json(z.array(Project), "All projects, in registration order") },
  }),
  (c) =>
    c.json(
      projects.map(({ changes: _, ...p }) => p),
      200,
    ),
);

app.openapi(
  createRoute({
    method: "get",
    path: "/projects/{name}",
    summary: "One project by name",
    request: { params: ProjectName },
    responses: {
      200: json(Project, "The project"),
      404: json(NotFound, "No project with this name"),
    },
  }),
  (c) => {
    const found = findProject(c.req.valid("param").name);
    if (!found) return c.json({ error: "project not found" }, 404);
    const { changes: _, ...p } = found;
    return c.json(p, 200);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/projects/{name}/changes",
    summary: "The change feed of one project, newest first",
    request: { params: ProjectName, query: ChangesQuery },
    responses: {
      200: json(z.array(Change), "Change entries, newest first"),
      404: json(NotFound, "No project with this name"),
    },
  }),
  (c) => {
    const found = findProject(c.req.valid("param").name);
    if (!found) return c.json({ error: "project not found" }, 404);
    const { kind, limit = 20 } = c.req.valid("query");
    const rows = found.changes
      .filter((ch) => !kind || ch.kind === kind)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
    return c.json(rows, 200);
  },
);

export const openapiConfig = {
  openapi: "3.1.0",
  info: {
    title: "Portolan hub API",
    version: "0.0.0",
    description: "Read-only view of the projects, docs and change feeds the hub holds.",
  },
};

app.doc31("/openapi.json", openapiConfig);
