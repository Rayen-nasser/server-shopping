const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  let decodeToken;
  if (!req.get("Authorization")) {
    res.json({ message: "Not Authenticated.!?" });
    error.statusCode = 401;
    return;
  }

  const token = req.get("Authorization").split(" ")[1];

  try {
    decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decodeToken;
  } catch (error) {
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Authentication failed" });
  }

  next();
};
