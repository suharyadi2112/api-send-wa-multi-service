const express = require('express');
const bodyParser = require('body-parser');
const {startAuthenticationthree, getClientInfothree, sendWaServicethree, getReconnecting} = require('./service_three');
const logger = require('../config/logger');//log


const app = express();

app.use(bodyParser.json());

// Endpoint cek status login
app.get('/three/status-service', getClientInfothree);
// Endpoint untuk menghasilkan QR code
app.get('/three/generate-qr-service', startAuthenticationthree);
// Endpoint untuk kirim pesan pada service three
app.post('/three/send-service', sendWaServicethree)
//reconnecting wa
app.get('/three/recon-service', getReconnecting)

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    logger.info(`Service 3 (three) is running on port ${PORT}`);
});