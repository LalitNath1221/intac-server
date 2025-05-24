const express = require('express');
const router = express.Router();
const Enquiry = require('../models/RoomEnquiry');
const Query = require('../models/Quries');
const { body, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');



router.post('/query', async (req, res) => {

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let query = await Query.create({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            message: req.body.message
        })
        res.json({ sucess: "Form has been submitted sucessfully" })
    } catch (error) {
        console.error(error.message);
        res.status(500).send("something went wrong")
    }
})

router.post('/roomenquiry', async (req, res) => {
    try {
        const { name, phone, checkIn, checkOut, roomType } = req.body;
        console.log(req.body)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!name || !phone || !checkIn || !checkOut || !roomType) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const newEnquiry = Enquiry.create({
            name: name,
            phone: phone,
            checkinDate: checkIn,
            checkoutDate: checkOut,
            roomType : roomType
        })
        res.status(201).json({ message: "Enquiry created successfully"});
    } catch (error) {
        console.error(error.message);
        res.status(500).send("something went wrong")
    }
})



module.exports = router