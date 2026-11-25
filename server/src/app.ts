import cookieParser from "cookie-parser";
import express from "express";
import { authRouter } from "./auth/routes.js";
import { postsRouter } from "./posts/routes.js";
import { usersRouter } from "./users/routes.js";

// Builds the Express app without starting a server, so tests can call it directly.
export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use(postsRouter);
  app.use(usersRouter);

  return app;
}
