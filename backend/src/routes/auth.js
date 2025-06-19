const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { executeQuery } = require("../utils/sqlHelper");
const { comparePassword } = require("../utils/passwordUtils");
const { asyncHandler, ValidationError } = require("../utils/errorHandler");
const logger = require("../utils/logger");

/**
 * @swagger
 * /api/auth:
 *   post:
 *     tags: [Authentication]
 *     summary: Authenticate user and get token
 *     description: Log in with username and password to receive an authentication token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token for authentication
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: User ID
 *                     username:
 *                       type: string
 *                       description: Username
 *                     role:
 *                       type: string
 *                       description: User role
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ValidationError("Username and password are required");
    }

    const user = await executeQuery(
      "SELECT * FROM users WHERE username = @username",
      { username }
    );

    if (!user?.length || !(await comparePassword(password, user[0].password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    await executeQuery(
      "UPDATE users SET last_login = GETDATE() WHERE id = @id",
      { id: user[0].id }
    );

    const token = jwt.sign(
      {
        id: user[0].id,
        role: user[0].role,
        username: user[0].username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const refreshToken = require("crypto").randomBytes(40).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await executeQuery(
      `MERGE INTO refresh_tokens AS target
       USING (SELECT @userId AS user_id) AS source
       ON (target.user_id = source.user_id)
       WHEN MATCHED THEN
         UPDATE SET 
           token = @token,
           expires_at = @expiresAt,
           created_at = GETDATE()
       WHEN NOT MATCHED THEN
         INSERT (user_id, token, expires_at, created_at)
         VALUES (@userId, @token, @expiresAt, GETDATE());`,
      {
        userId: user[0].id,
        token: refreshToken,
        expiresAt,
      }
    );

    logger.info(`User ${username} logged in successfully`);

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user[0].id,
        username: user[0].username,
        role: user[0].role,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh authentication token
 *     description: Get a new JWT token using a refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token received during login
 *     responses:
 *       200:
 *         description: Successfully refreshed token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: New JWT token
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: User ID
 *                     username:
 *                       type: string
 *                       description: Username
 *                     role:
 *                       type: string
 *                       description: User role
 *       401:
 *         description: Invalid refresh token
 *       500:
 *         description: Server error
 */
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError("Refresh token is required");
    }

    const tokenRecord = await executeQuery(
      "SELECT * FROM refresh_tokens WHERE token = @token AND expires_at > GETDATE()",
      { token: refreshToken }
    );

    if (!tokenRecord?.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await executeQuery("SELECT * FROM users WHERE id = @userId", {
      userId: tokenRecord[0].user_id,
    });

    if (!user?.length) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const newToken = jwt.sign(
      {
        id: user[0].id,
        role: user[0].role,
        username: user[0].username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const newRefreshToken = require("crypto").randomBytes(40).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await executeQuery(
      `UPDATE refresh_tokens 
       SET token = @newToken, expires_at = @expiresAt 
       WHERE token = @oldToken`,
      {
        newToken: newRefreshToken,
        expiresAt,
        oldToken: refreshToken,
      }
    );

    logger.info(`User ${user[0].username} refreshed their token`);

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user[0].id,
        username: user[0].username,
        role: user[0].role,
      },
    });
  })
);

module.exports = router;
