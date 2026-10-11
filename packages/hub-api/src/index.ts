import { app } from "./app";

const port = Number(process.env.PORT ?? 8787);

export default { port, fetch: app.fetch };

console.log(`hub-api listening on http://localhost:${port}`);
