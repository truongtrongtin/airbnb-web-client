import {
  unstable_createViteServer,
  unstable_loadViteServerBuild,
} from "@remix-run/dev";
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import express from "express";

installGlobals();

let vite =
  process.env.NODE_ENV === "production"
    ? undefined
    : await unstable_createViteServer();

export const app = express();

// handle asset requests
if (vite) {
  app.use(vite.middlewares);
} else {
  app.use(
    "/build",
    express.static("public/build", { immutable: true, maxAge: "1y" })
  );
}
app.use(express.static("public", { maxAge: "1h" }));

// handle SSR requests
app.all(
  "*",
  createRequestHandler({
    build: vite
      ? () => unstable_loadViteServerBuild(vite)
      : await import("./build/index.js"),
  })
);

// https://cloud.google.com/functions/docs/configuring/env-var#newer_runtimes
const isOnGoogleCloud = Boolean(
  process.env.K_SERVICE && process.env.K_REVISION
);

if (!isOnGoogleCloud) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log("http://localhost:" + port));
}
