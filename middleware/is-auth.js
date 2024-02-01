const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    let decodeToken;
    if (!req.get('Authorization')) {
        res.json({error: "Not Authenticated.!?"})
        error.statusCode = 401;
        return 
    }

    const token = req.get('Authorization').split(' ')[1];

    try {
        decodeToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userData = decodeToken;
    } catch (error) {
        // Corrected the variable name from `err` to `error`
        error.statusCode = 500;
        throw error;
    }

    if (!decodeToken) {
        const error = new Error("Not Authenticated");
        error.statusCode = 401;
        throw error;
    }    

    next();
};