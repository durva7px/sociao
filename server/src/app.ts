import express from "express";
import { authRouter } from "./auth/routes.js";

// Builds the Express app without starting a server, so tests can call it directly.
export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);

  return app;
}
