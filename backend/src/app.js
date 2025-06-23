const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const { rateLimit } = require("express-rate-limit");
const routes = require("./routes");
const errorMiddleware = require("./middleware/errorMiddleware");
const logger = require("./utils/logger");
const swagger = require("./config/swagger");
const { protect } = require("./middleware/authMiddleware");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

app.use(compression());

const limiter = rateLimit({
  max: 10000,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api", limiter);

app.use("/api/auth", routes.auth);
app.use("/api-docs", swagger.serve, swagger.setup);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/stops", protect, routes.stops);
app.use("/api/lines", protect, routes.lines);
app.use("/api/line-types", protect, routes.lineTypes);

app.use(
  "/api-docs",
  process.env.NODE_ENV === "production"
    ? (req, res, next) => {
        const authHeader = req.headers.authorization;
        const user = process.env.SWAGGER_USER;
        const pass = process.env.SWAGGER_PASSWORD;

        if (!user || !pass) {
          return next();
        }

        if (!authHeader || !authHeader.startsWith("Basic ")) {
          res.setHeader("WWW-Authenticate", "Basic");
          return res.status(401).send("Authentication required.");
        }

        const base64Credentials = authHeader.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString(
          "ascii"
        );
        const [username, password] = credentials.split(":");

        if (username !== user || password !== pass) {
          res.setHeader("WWW-Authenticate", "Basic");
          return res.status(401).send("Invalid authentication credentials.");
        }

        return next();
      }
    : (req, res, next) => next(),
  swagger.serve,
  swagger.setup
);

app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Cannot find ${req.originalUrl} on this server!`,
  });
});

app.use(errorMiddleware);

module.exports = app;
