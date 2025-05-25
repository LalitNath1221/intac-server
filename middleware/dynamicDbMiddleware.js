const connectToDynamicDB = require("../DynaimicDB");

// middleware/dynamicDbMiddleware.js
const dynamicDbMiddleware = async (req, res, next) => {
  const { server, user, password, database } = req.headers;

  if (!server || !user || !password || !database) {
    return res.status(400).json({ error: "Missing database connection details in headers" });
  }

  const pool = await connectToDynamicDB({ server, user, password, database });

  if (!pool) {
    return res.status(500).json({ errorCode: "SERVER_NOT_CONNECTED", message: "Unable to connect to database" });
  }

  req.db = pool;
  next();
};

module.exports = dynamicDbMiddleware;
