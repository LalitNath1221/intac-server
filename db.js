const sql = require("mssql");

// Database configuration
//sqlcmd -S 208.91.198.174 -U shpa -P 'XAbcd#2025'
const config = {
    user: 'shpa',
    password: 'XAbcd#2025',
    server: '208.91.198.174',
    database: 'Bitware',
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
const connectToMainDB = new sql.ConnectionPool(config)
    .connect()
    .then((pool) => {
        console.log("Connected to SQL Server");
        return pool;
    })
    .catch((err) => {
        console.error("Database Connection Failed! Bad Config: ", err);
        throw err;
    });

module.exports = connectToMainDB;