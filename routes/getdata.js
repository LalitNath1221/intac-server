const express = require('express');
const sql = require("mssql");
const router = express.Router();
const Query = require('../models/Quries');
const Enquiry = require('../models/RoomEnquiry')
const fetchuser = require('../middleware/fetchuser');
const connectToMainDB = require('../db');
const connectToDynamicDB = require('../DynaimicDB');
const dynamicDbMiddleware = require('../middleware/dynamicDbMiddleware');

router.get("/employee", async (req, res) => {
    try {
        const pool = await connectToDynamicDB;

        // Parse query parameters for pagination
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const pageSize = 50; // Number of records per page

        const offset = (page - 1) * pageSize;

        // Query to fetch paginated data
        const result = await pool.request()
            .input("pageSize", sql.Int, pageSize)
            .input("offset", sql.Int, offset)
            .query(`
                SELECT * 
                FROM ldgr
                OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
            `);

        // Get total count for all records
        const allUser = await pool.request().query("SELECT Accid, ACNAME FROM ACCMST ORDER BY ACNAME");

        const countResult = await pool.request().query("SELECT COUNT(*) AS totalCount FROM ACCMST");
        const totalCount = countResult.recordset[0].totalCount;

        // Prepare response
        const response = {
            listName: "List of Employees",
            currentPage: page,
            pageSize: pageSize,
            totalRecords: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            data: result.recordset,
            allUser: allUser.recordset
        };

        res.json(response);
    } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).send("Error fetching data");
    }
});


router.get("/ledger", dynamicDbMiddleware, async (req, res) => {
    const pool = req.db;

    try {

        const page = parseInt(req.query.page) || 1;
        const pageSize = 50;
        const offset = (page - 1) * pageSize;

        const accid = req.query.accid;
        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;

        if (!accid) {
            return res.status(400).json({ error: "accid is required" });
        }

        let whereClauses = ["accid = @accid"];
        let request = pool.request();

        request.input("accid", sql.VarChar, accid);
        request.input("offset", sql.Int, offset);
        request.input("pageSize", sql.Int, pageSize);

        if (fromDate && toDate) {
            whereClauses.push("trndate BETWEEN @fromDate AND @toDate");
            request.input("fromDate", sql.Date, fromDate);
            request.input("toDate", sql.Date, toDate);
        } else if (fromDate) {
            whereClauses.push("trndate >= @fromDate");
            request.input("fromDate", sql.Date, fromDate);
        } else if (toDate) {
            whereClauses.push("trndate <= @toDate");
            request.input("toDate", sql.Date, toDate);
        }

        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // Opening balance: sum of debit - credit before fromDate
        let openingBalance = 0;
        if (fromDate) {
            const openingRequest = pool.request();
            openingRequest.input("accid", sql.VarChar, accid);
            openingRequest.input("fromDate", sql.Date, fromDate);

            const openingResult = await openingRequest.query(`
                SELECT ISNULL(SUM(damount), 0) AS totalDebit, ISNULL(SUM(camount), 0) AS totalCredit
                FROM ldgr
                WHERE accid = @accid AND trndate < @fromDate
            `);

            const { totalDebit, totalCredit } = openingResult.recordset[0];
            openingBalance = parseFloat(totalDebit) - parseFloat(totalCredit);
        } else {
            openingBalance = 0;
        }

        // Fetch paginated transactions in date range
        const dataQuery = `
            SELECT * 
            FROM ldgr
            ${whereSQL}
            ORDER BY trndate ASC
            OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
        `;

        const countQuery = `
            SELECT COUNT(*) AS totalCount 
            FROM ldgr
            ${whereSQL}
        `;

        const result = await request.query(dataQuery);
        const countResult = await request.query(countQuery);
        const totalCount = countResult.recordset[0].totalCount;

        // Calculate closing balance per entry
        let runningBalance = openingBalance;
        const processedData = result.recordset.map(entry => {
            const debit = parseFloat(entry.damount || 0);
            const credit = parseFloat(entry.camount || 0);
            runningBalance += debit - credit;

            return {
                ...entry,
                closingBalance: runningBalance
            };
        });

        // Fetch list of accounts
        const accountList = await pool.request().query(`
            SELECT DISTINCT l.accid, a.ACNAME 
            FROM ldgr l 
            JOIN ACCMST a ON l.accid = a.accid 
            ORDER BY a.ACNAME
        `);

        res.json({
            listName: "List of Ledger Entries",
            currentPage: page,
            pageSize,
            totalRecords: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            openingBalance,
            data: processedData,
            accounts: accountList.recordset
        });

    } catch (err) {
        console.error("Error fetching ledger data:", err);
        res.status(500).send("Internal server error");
    } finally {
        await pool.close();
    }
});

router.get("/ledger/export", dynamicDbMiddleware, async (req, res) => {
    const pool = req.db;

    try {
        const accid = req.query.accid;
        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;

        if (!accid) {
            return res.status(400).json({ error: "accid is required" });
        }

        let whereClauses = ["accid = @accid"];
        let request = pool.request();
        request.input("accid", sql.VarChar, accid);

        if (fromDate && toDate) {
            whereClauses.push("trndate BETWEEN @fromDate AND @toDate");
            request.input("fromDate", sql.Date, fromDate);
            request.input("toDate", sql.Date, toDate);
        } else if (fromDate) {
            whereClauses.push("trndate >= @fromDate");
            request.input("fromDate", sql.Date, fromDate);
        } else if (toDate) {
            whereClauses.push("trndate <= @toDate");
            request.input("toDate", sql.Date, toDate);
        }

        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // Opening balance calculation same as before
        let openingBalance = 0;
        if (fromDate) {
            const openingRequest = pool.request();
            openingRequest.input("accid", sql.VarChar, accid);
            openingRequest.input("fromDate", sql.Date, fromDate);

            const openingResult = await openingRequest.query(`
                SELECT ISNULL(SUM(damount), 0) AS totalDebit, ISNULL(SUM(camount), 0) AS totalCredit
                FROM ldgr
                WHERE accid = @accid AND trndate < @fromDate
            `);

            const { totalDebit, totalCredit } = openingResult.recordset[0];
            openingBalance = parseFloat(totalDebit) - parseFloat(totalCredit);
        }

        const dataQuery = `
            SELECT * 
            FROM ldgr
            ${whereSQL}
            ORDER BY trndate ASC
        `;

        const result = await request.query(dataQuery);

        let runningBalance = openingBalance;
        const processedData = result.recordset.map(entry => {
            const debit = parseFloat(entry.damount || 0);
            const credit = parseFloat(entry.camount || 0);
            runningBalance += debit - credit;

            return {
                ...entry,
                closingBalance: runningBalance
            };
        });

        res.json({
            openingBalance,
            data: processedData
        });

    } catch (err) {
        console.error("Error exporting ledger data:", err);
        res.status(500).send("Internal server error");
    } finally {
        await pool.close();
    }
});


router.get("/accounts", dynamicDbMiddleware, async (req, res) => {
    const pool = req.db;
    try {


        let request = pool.request();


        // Fetch distinct accid and account names (with JOIN here only)
        const accountList = await pool.request().query(`
            SELECT DISTINCT l.accid, a.ACNAME 
            FROM ldgr l 
            JOIN ACCMST a ON l.accid = a.accid 
            ORDER BY a.ACNAME
        `);
        //console.log(accountList.recordset)
        res.json({
            listName: "List of Accounts",
            accounts: accountList.recordset
        });

    } catch (err) {
        console.error("Error fetching ledger data:", err);
        res.status(500).send("Internal server error");
    } finally {
        await pool.close();
    }
});



// Get person details by ID


router.get("/employee/search", async (req, res) => {
    try {
        const pool = await poolPromise;

        // Parse query parameters
        const searchQuery = req.query.name || ""; // Default to empty string if no search query
        const page = parseInt(req.query.page, 10) || 1; // Ensure it's a number and default to 1
        const pageSize = 50; // Number of records per page
        const offset = (page - 1) * pageSize;

        // Log the parameters for debugging
        console.log(`searchQuery: ${searchQuery}, page: ${page}, offset: ${offset}`);

        // Validate if page is a positive number
        if (isNaN(page) || page < 1) {
            return res.status(400).send("Invalid page number.");
        }

        // Query to fetch filtered users (paginated)
        const result = await pool.request()
            .input("name", sql.VarChar, `%${searchQuery}%`)
            .input("pageSize", sql.Int, pageSize)
            .input("offset", sql.Int, offset)
            .query(`
                SELECT * 
                FROM ACCMST
                WHERE acname LIKE @name
                ORDER BY Accid
                OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
            `);

        // Log query result
        console.log(`Fetched ${result.recordset.length} records`);

        // Query to get total count of matching users
        const countResult = await pool.request()
            .input("name", sql.VarChar, `%${searchQuery}%`)
            .query("SELECT COUNT(*) AS totalCount FROM ACCMST WHERE ACNAME LIKE @name");

        // Query to get all users for `allUser` field
        const allUserResult = await pool.request()
            .query("SELECT Accid, ACNAME FROM ACCMST ORDER BY ACNAME");

        const totalCount = countResult.recordset[0].totalCount;

        // Prepare response
        const response = {
            listName: "Employee Search",
            currentPage: page,
            pageSize: pageSize,
            totalRecords: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            data: result.recordset, // Paginated results
            allUser: allUserResult.recordset, // Full list of users
        };

        res.json(response);
    } catch (err) {
        console.error("Error fetching data:", err);
        console.error("Stack Trace:", err.stack); // Log detailed error info
        res.status(500).send("Error fetching data");
    }
});

router.get("/employee/:id", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.VarChar, req.params.id)
            .query("SELECT * FROM ACCMST WHERE Accid = @id");
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Error fetching details:", err);
        res.status(500).send("Error fetching details");
    }
});

module.exports = router