require("dotenv").config();
const app = require("./src/app");
const logger = require("./src/utils/logger");
const db = require("./src/utils/sqlHelper");

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

db.testConnection()
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    const shutdown = () => {
      logger.info("Received shutdown signal, closing server...");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  })
  .catch((err) => {
    logger.error("Database connection failed:", err);
    process.exit(1);
  });
