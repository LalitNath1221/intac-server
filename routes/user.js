const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');
const connectToMainDB = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'abc#1379877';

 // Use env var in production


router.post('/createuser', async (req, res)=>{

    try {
        
    const errors = validationResult (req);
    if (!errors.isEmpty()) {
    return res.status (400).json ({ errors: errors.array() });
    }
    let user = await User.findOne ({email: req.body.email});
    if (user) {
    return res.status (400).json ({error: "Sorry a user with this email already exists"});
    }
    
    user  = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
    })

    const data = {
        user:{
            id: user.id
        }
    }
    const authTocken = jwt.sign(data, JWT_KEY);

    res.json({authTocken})
    } catch (error) {
            console.error(error.message);
            res.status(500).send("something went wrong")
    }
})

router.post('/main-login', async (req, res)=>{

    try {
    const errors = validationResult (req);
    if (!errors.isEmpty()) {
    return res.status (400).json ({ errors: errors.array() });
    }
    const {email, password} = req.body

    let user = await User.findOne ({email});
    if (!user) {
    return res.status (400).json ({error: "Please enter correct credentials"});
    }
    if(user.password != password){
        return res.status (400).json ({error: "Please enter correct credentials"});
    }

    const data = {
        user:{
            id: user.id
        }
    }

    const authTocken = jwt.sign(data, JWT_SECRET);
    res.json({sucess: "Login Sucess",authTocken})
    } catch (error) {
            console.error(error.message);
            res.status(500).send("something went wrong")
    }
})

router.post('/getuser', fetchuser, async (req, res)=>{
    try {
        const userId= req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send(user);
    } catch (error) {
        res.status(500).send("enternal server error")
    }
})


router.post('/user-login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await connectToMainDB;

    const result = await pool
      .request()
      .input('username', username)
      .input('password', password)
      .query('SELECT * FROM userlog WHERE id = @username AND password = @password');

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.recordset[0];
    //console.log(user);

    // Create JWT token
    const token = jwt.sign(
      {
        username: user.id,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      userDbInfo: user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/verify-token', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Connect to main DB to verify user still exists
    const pool = await connectToMainDB;
    const result = await pool
      .request()
      .input('username', decoded.username)
      .query('SELECT * FROM userlog WHERE id = @username');

      console.log(result)
    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    const user = result.recordset[0];

    return res.json({
      success: true,
      message: 'Token is valid',
      user: {
        username: user.id,
        userId: user.user_id || user.id, // adjust as per schema
        dbInfo: user
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});


module.exports = router