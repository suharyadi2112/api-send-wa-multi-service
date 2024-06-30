const express = require('express');
const bodyParser = require('body-parser');
const {startAuthenticationtwo, getClientInfotwo, sendWaServicetwo, getReconnecting} = require('./service_two');
const {sendWaServiceBackup} = require('../service_backup');
const logger = require('../config/logger');//log
const { authenticateToken } = require('../config/jwtoken');
const { limiter } = require('../config/ratelimiter');

const app = express();
app.use(bodyParser.json());

// Endpoint cek status login
app.get('/two/status-service',authenticateToken, limiter, getClientInfotwo);
// Endpoint untuk menghasilkan QR code
app.get('/two/generate-qr-service',authenticateToken, limiter, startAuthenticationtwo);


// Endpoint untuk kirim pesan pada service two
app.post('/two/send-service',authenticateToken, limiter, sendWaServicetwo)
// app.post('/two/send-service', limiter, sendWaServiceBackup)

//reconnecting wa
app.get('/two/recon-service',authenticateToken, limiter, getReconnecting)


const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    logger.info(`Service 2 (two) is running on port ${PORT}`);
});