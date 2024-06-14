const rateLimit = require('express-rate-limit');

// Rate limiter middleware
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // Jendela waktu 1 menit
    max: 50, // Maksimum 50 permintaan per jendela waktu per IP
    message: 'Too many requests from this IP, please try again after a minute',
    headers: true,
});
module.exports = {
    limiter,
};