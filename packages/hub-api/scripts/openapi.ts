/** Writes the OpenAPI document to docs/api/openapi.json. Run after any route change. */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { app, openapiConfig } from "../src/app";

const out = resolve(import.meta.dir, "../../../docs/api/openapi.json");
mkdirSync(dirname(out), { recursive: true });
const doc = app.getOpenAPI31Document(openapiConfig);
await Bun.write(out, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`wrote ${out}`);
