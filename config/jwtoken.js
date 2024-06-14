const jwt = require('jsonwebtoken');
const logger = require('../config/logger');//log


const SECRET_KEY = 'suharyadigantengsekali123';
let expireSet = '5h';

const generateToken = (user) => {
    const token = jwt.sign(user, SECRET_KEY, { expiresIn: expireSet }); 
    logger.info(`Token successfully generated for ${user.username} on service one`); 
    return token;
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.error('Authentication failed on service one: Token not provided');
        return res.sendStatus(401);
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return next(err);
            }
            console.error('Error verifying token:', err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

module.exports = {
    generateToken,
    authenticateToken
};


