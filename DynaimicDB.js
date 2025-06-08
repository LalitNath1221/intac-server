// db/connectToDynamicDB.js
const sql = require('mssql');

async function connectToDynamicDB({ server, user, password, database }) {
  const config = {
    server,
    user,
    password,
    database,
    pool: {
      max: 20,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  try {
    const pool = new sql.ConnectionPool(config);
    const connectedPool = await pool.connect();
    console.log(`Connected to SQL Server: ${server} / DB: ${database}`);
    return connectedPool;
  } catch (err) {
    console.error("Database Connection Failed:", err.message);
    return null;
  }
}

module.exports = connectToDynamicDB;
