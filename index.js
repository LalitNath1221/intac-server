const express = require('express')
const app = express()
const cors = require('cors')
const { sql, poolPromise } = require("./db");

app.use(cors())
app.use(express.json());  // Parses application/json
app.use(express.urlencoded({ extended: true }));

// Get all persons from ACCMST
app.use('/api/getdata', require('./routes/getdata'))
app.use('/api/user', require('./routes/user'))


app.get("/", async (req, res)=>{
    res.send("working");
})
// Start server
app.listen(5000, () => console.log("Server running on http://localhost:5000"));
