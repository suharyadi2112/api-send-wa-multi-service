const express = require('express');
const bodyParser = require('body-parser');
const {startAuthenticationtwo, getClientInfotwo, sendWaServicetwo, getReconnecting} = require('./service_two');
const logger = require('../config/logger');//log
const { authenticateToken } = require('../config/jwtoken');


const app = express();
app.use(bodyParser.json());

// Endpoint cek status login
app.get('/two/status-service',authenticateToken, getClientInfotwo);
// Endpoint untuk menghasilkan QR code
app.get('/two/generate-qr-service',authenticateToken, startAuthenticationtwo);
// Endpoint untuk kirim pesan pada service two
app.post('/two/send-service',authenticateToken, sendWaServicetwo)
//reconnecting wa
app.get('/two/recon-service',authenticateToken, getReconnecting)


const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    logger.info(`Service 2 (two) is running on port ${PORT}`);
});