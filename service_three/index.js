const express = require('express');
const bodyParser = require('body-parser');
const {startAuthenticationthree, getClientInfothree, sendWaServicethree, getReconnecting} = require('./service_three');
const logger = require('../config/logger');//log
const { authenticateToken } = require('../config/jwtoken');


const app = express();

app.use(bodyParser.json());

// Endpoint cek status login
app.get('/three/status-service',authenticateToken, getClientInfothree);
// Endpoint untuk menghasilkan QR code
app.get('/three/generate-qr-service',authenticateToken, startAuthenticationthree);
// Endpoint untuk kirim pesan pada service three
app.post('/three/send-service',authenticateToken, sendWaServicethree)
//reconnecting wa
app.get('/three/recon-service',authenticateToken, getReconnecting)

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    logger.info(`Service 3 (three) is running on port ${PORT}`);
});