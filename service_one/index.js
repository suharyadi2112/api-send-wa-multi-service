const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const {startAuthenticationOne, getClientInfoOne, sendWaServiceOne, getReconnecting} = require('./service_one');
const logger = require('../config/logger');//log


const app = express();

app.use(bodyParser.json());

// Endpoint cek status login
app.get('/status-service-one', getClientInfoOne);
// Endpoint untuk menghasilkan QR code
app.get('/generate-qr-service-one', startAuthenticationOne);
// Endpoint untuk kirim pesan pada service one
app.post('/send-service-one', sendWaServiceOne)
//reconnecting wa
app.get('/recon-service-one', getReconnecting)

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    logger.info(`Service 1 (one) is running on port ${PORT}`);
});