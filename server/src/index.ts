import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import router from "./routes";
import pool from "./db";

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json());

// API routes
app.use(router);

// In production, serve the frontend static files
if (isProduction) {
  const clientDistPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDistPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientDistPath, "index.html"));
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (isProduction) {
    console.log("Serving frontend from client/dist");
  }
});

// Cloud Run sends SIGTERM before stopping an instance; docker compose does too.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 8000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
