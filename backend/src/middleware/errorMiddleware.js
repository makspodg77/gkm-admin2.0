const logger = require("../utils/logger");

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error("Error:", {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // SQL Server specific error handling
  if (err.info && err.number) {
    // Database connection errors
    if (err.number === 18456) {
      error = new AppError("Database authentication failed", 500);
    }

    // Unique constraint violation
    if (err.number === 2627 || err.number === 2601) {
      error = new AppError(
        "Duplicate value for a field that must be unique",
        400
      );
    }

    // Foreign key constraint violation
    if (err.number === 547) {
      error = new AppError("Cannot delete or update a parent row", 400);
    }
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again", 401);
  }

  // JWT expired
  if (err.name === "TokenExpiredError") {
    error = new AppError("Your token has expired. Please log in again", 401);
  }

  // Send error response
  if (error.isOperational) {
    // Operational, trusted error
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    // Programming or other unknown error
    console.error("ERROR 💥", error);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

module.exports = errorMiddleware;
module.exports.AppError = AppError;
