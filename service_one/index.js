const express = require('express');
const bodyParser = require('body-parser');
const {startAuthenticationOne, getClientInfoOne, sendWaServiceOne, getReconnecting} = require('./service_one');
const {sendWaServiceBackup} = require('../service_backup');
const logger = require('../config/logger');//log
const { generateToken, authenticateToken } = require('../config/jwtoken');
const { limiter } = require('../config/ratelimiter');

const app = express();
app.use(bodyParser.json());

app.post('/one/login', limiter, (req, res) => {
    const { username, password } = req.body;
    if (username === 'suharyadi' && password === 'ganteng') {
        const token = generateToken({ username });
        
        logger.info(`Successfully sign for ${username}`); 
        return res.json({ token });
    } else {
        logger.warn(`Invalid credentials ${username}`); 
        return res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Endpoint cek status login
app.get('/one/status-service',authenticateToken, limiter, getClientInfoOne);
// Endpoint untuk menghasilkan QR code
app.get('/one/generate-qr-service',authenticateToken, limiter, startAuthenticationOne);
// Endpoint untuk kirim pesan pada service one

//service wa backup matikan jika service biasa rusak
app.post('/one/send-service',authenticateToken, limiter, sendWaServiceOne)
// app.post('/one/send-service', limiter, sendWaServiceBackup)


// reconnecting wa
app.get('/one/recon-service',authenticateToken, limiter, getReconnecting)

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    logger.info(`Service 1 (one) is running on port ${PORT}`);
});