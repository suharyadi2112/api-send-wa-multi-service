const express = require('express');
const bodyParser = require('body-parser');
const {startAuthenticationtwo, getClientInfotwo, sendWaServicetwo, getReconnecting} = require('./service_two');
const logger = require('../config/logger');//log


const app = express();

app.use(bodyParser.json());

// Endpoint cek status login
app.get('/two/status-service', getClientInfotwo);
// Endpoint untuk menghasilkan QR code
app.get('/two/generate-qr-service', startAuthenticationtwo);
// Endpoint untuk kirim pesan pada service two
app.post('/two/send-service', sendWaServicetwo)
//reconnecting wa
app.get('/two/recon-service', getReconnecting)

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    logger.info(`Service 2 (two) is running on port ${PORT}`);
});