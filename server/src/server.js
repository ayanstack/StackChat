import http from "http";

import app from "./app.js";
import { env, validateEnv } from "./config/env.js";
import { connectDB } from "./database/connect.js";
import logger from "./logger/logger.js";
import { initializeSocket } from "./sockets/socket.js";

validateEnv();

async function startServer() {
  await connectDB();

  const server = http.createServer(app);

  initializeSocket(server);

  server.listen(env.PORT, () => {
    logger.info(
      `Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`
    );
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT received. Shutting down gracefully...");

    server.close(() => {
      process.exit(0);
    });
  });
}

startServer();