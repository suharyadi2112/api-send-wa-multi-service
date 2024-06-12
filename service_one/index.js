const express = require('express');
const bodyParser = require('body-parser');
const {startAuthenticationOne, getClientInfoOne, sendWaServiceOne, getReconnecting} = require('./service_one');
const logger = require('../config/logger');//log


const app = express();

app.use(bodyParser.json());

// Endpoint cek status login
app.get('/one/status-service', getClientInfoOne);
// Endpoint untuk menghasilkan QR code
app.get('/one/generate-qr-service', startAuthenticationOne);
// Endpoint untuk kirim pesan pada service one
app.post('/one/send-service', sendWaServiceOne)
//reconnecting wa
app.get('/one/recon-service', getReconnecting)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Service 1 (one) is running on port ${PORT}`);
});