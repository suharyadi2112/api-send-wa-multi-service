const express = require('express');
const bodyParser = require('body-parser');
const {startAuthenticationOne, getClientInfoOne, sendWaServiceOne, getReconnecting} = require('./service_one');
const logger = require('../config/logger');//log
const { generateToken, authenticateToken } = require('../config/jwtoken');

const app = express();
app.use(bodyParser.json());

app.post('/one/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'suharyadi' && password === 'ganteng') {
        const token = generateToken({ username });
        return res.json({ token });
    } else {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Endpoint cek status login
app.get('/one/status-service',authenticateToken, getClientInfoOne);
// Endpoint untuk menghasilkan QR code
app.get('/one/generate-qr-service',authenticateToken, startAuthenticationOne);
// Endpoint untuk kirim pesan pada service one
app.post('/one/send-service',authenticateToken, sendWaServiceOne)
// reconnecting wa
app.get('/one/recon-service',authenticateToken, getReconnecting)


// ------------------- jwt section -----------------//
app.use((err, req, res, next) => {
    if (err.name === 'TokenExpiredError') {
        logger.info(`Token on service one expired`);
        return res.status(401).json({ message: 'Token expired' });
    }
    
    logger.info(`Terjadi kesalahan di service one ${err}`);
    return res.status(403).json({ message: err });
});


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    logger.info(`Service 1 (one) is running on port ${PORT}`);
});