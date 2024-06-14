const jwt = require('jsonwebtoken');
const logger = require('../config/logger');//log


const SECRET_KEY = 'suharyadigantengsekali123';
let expireSet = '10s';

const generateToken = (user) => {
    const payload = {
        userId: user.id,
        username: user.username
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: expireSet });
    
    logger.info(`Token successfully generated for ${user.username}`); 
    return token;
};


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn(`token invalid`); 
        return res.sendStatus(401); // Token tidak ditemukan
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                logger.warn(`Token expired`); 
                return res.status(401).json({ message: 'Token expired', status : 'exp' });
            }
            logger.error(`Error verifying token ${err}`); 
            return res.sendStatus(403); // Token tidak valid atau kesalahan lain
        }
        
        req.user = user; // Token valid, lanjutkan ke middleware berikutnya atau ke handler endpoint
        next();
    });
};
module.exports = {
    generateToken,
    authenticateToken
};


