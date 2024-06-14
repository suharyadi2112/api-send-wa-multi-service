const express = require('express');
const bodyParser = require('body-parser');
const {startAuthenticationthree, getClientInfothree, sendWaServicethree, getReconnecting} = require('./service_three');
const logger = require('../config/logger');//log
const { authenticateToken } = require('../config/jwtoken');
const { limiter } = require('../config/ratelimiter');

const app = express();
app.use(bodyParser.json());

// Endpoint cek status login
app.get('/three/status-service',authenticateToken, limiter, getClientInfothree);
// Endpoint untuk menghasilkan QR code
app.get('/three/generate-qr-service',authenticateToken, limiter, startAuthenticationthree);
// Endpoint untuk kirim pesan pada service three
app.post('/three/send-service',authenticateToken, limiter, sendWaServicethree)
//reconnecting wa
app.get('/three/recon-service',authenticateToken, limiter, getReconnecting)

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    logger.info(`Service 3 (three) is running on port ${PORT}`);
});