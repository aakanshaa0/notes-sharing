const jwt = require("jsonwebtoken");
const JWT_USER_PASSWORD = process.env.JWT_USER_PASSWORD;

function authMiddleware(req, res, next){
    const token = req.headers["authorization"]?.split(" ")[1];
    if(!token){
        return res.status(401).json({
            message: "Unauthorized"
        })
    } 
    try{
        const decoded = jwt.verify(token, JWT_USER_PASSWORD);
        req.userId = decoded.id;
        next();
    }
    catch(e){
        return res.status(401).json({
            message: "Unauthorized"
        })
    }
}

module.exports = {
    authMiddleware
}