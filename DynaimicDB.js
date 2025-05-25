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
    const pool = await sql.connect(config);
    console.log(`Connected to SQL Server: ${server} / DB: ${database}`);
    return pool;
  } catch (err) {
    console.error("Database Connection Failed:", err.message);
    return null;
  }
}

module.exports = connectToDynamicDB;
