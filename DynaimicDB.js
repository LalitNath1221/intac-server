const sql = require('mssql');

//sqlcmd -S 122.176.35.15 -U shri -P '123'
const config = {
  server: '122.176.35.15',
  user: 'shri',
  password: '123',
  database: 'shri1',
    pool: {
        max: 20,         // Maximum number of connections in the pool
        min: 0,          // Minimum number of connections in the pool
        idleTimeoutMillis: 30000, // Idle timeout for unused connections
    },
    options: {
        encrypt: false,              // Disable encryption for older SQL Server versions
        trustServerCertificate: true // Use this for self-signed certificates
    },
};


// Establish a connection pool
const connectToDynamicDB = new sql.ConnectionPool(config)
    .connect()
    .then((pool) => {
        console.log("Connected to SQL Server 2");
        return pool;
    })
    .catch((err) => {
        console.error("Database Connection Failed! Bad Config: ", err);
        throw err;
    });

module.exports = connectToDynamicDB;