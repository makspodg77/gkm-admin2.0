const sql = require("mssql");
const { DatabaseError } = require("./errorHandler");
const logger = require("./logger");
const { config } = require("../config/database");
let globalPool = null;

const getPool = async () => {
  if (!globalPool) {
    globalPool = await sql.connect(config);
    logger.info("SQL Server connection pool created");
  }
  return globalPool;
};

const executeQuery = async (query, params = {}, transaction = null) => {
  try {
    const pool = await getPool();
    const request = transaction ? transaction.request() : pool.request();

    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    logger.error("Query error:", err);
    throw new DatabaseError(`Database query failed: ${err.message}`);
  }
};

const beginTransaction = async () => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  return transaction;
};

const commitTransaction = async (transaction) => {
  await transaction.commit();
};

const rollbackTransaction = async (transaction) => {
  await transaction.rollback();
};

const closePool = async () => {
  if (globalPool) {
    try {
      await globalPool.close();
      globalPool = null;
      logger.info("SQL Server connection pool closed");
    } catch (err) {
      logger.error("Error closing pool:", err);
      throw err;
    }
  }
};

// For testing database connection
const testConnection = async () => {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS testResult");
    logger.info("Database connection test successful");
    return true;
  } catch (err) {
    logger.error("Database connection test failed:", err);
    throw err;
  }
};

module.exports = {
  executeQuery,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  closePool,
  getPool,
  testConnection,
};
