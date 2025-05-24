var jwt = require('jsonwebtoken');
const JWT_KEY = "akey";

const fetchuser = (req, res, next) => {
// Get the user from the jt token and add id to req object.
    const token = decodeURIComponent(req.query.authTocken);
    //token = decodeURIComponent(token)
    if (!token) {
    res.status (401).send({ error: "Please authenticate using a valid token" }) //change to not found page
    }
    try {
        const data = jwt.verify(token, JWT_KEY);
        if(data.user){
            next();
        }
    } catch (error) {
        res.status (401).send({ error: "Please authenticate using a valid token" })
    }
}
module.exports = fetchuser;