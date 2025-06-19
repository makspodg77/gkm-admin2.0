const jwt = require("jsonwebtoken");
const { ValidationError } = require("../utils/errorHandler");
const { executeQuery } = require("../utils/sqlHelper");
const logger = require("../utils/logger");

/**
 * Middleware to protect routes by validating JWT tokens
 */
exports.protect = async (req, res, next) => {
  try {
    // 1. Check if token exists in Authorization header
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in to access this resource.",
      });
    }

    // 2. Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Check if the user still exists
      const user = await executeQuery(
        "SELECT id, username, role FROM users WHERE id = @id",
        { id: decoded.id }
      );

      if (!user?.length) {
        return res.status(401).json({
          success: false,
          message: "The user associated with this token no longer exists.",
        });
      }

      // 4. Add user info to request object
      req.user = {
        id: user[0].id,
        username: user[0].username,
        role: user[0].role,
      };

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please log in again.",
          tokenExpired: true,
        });
      }

      logger.error("Token validation error:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
  } catch (error) {
    logger.error("Auth middleware error:", error);
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param {...String} roles - Roles allowed to access the route
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please log in to access this resource",
      });
    }

    // Check if user role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};
