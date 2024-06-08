const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const {startAuthenticationOne, getClientInfoOne, sendWaServiceOne} = require('./service_one');


const app = express();

app.use(bodyParser.json());

// Endpoint cek status login
app.get('/status-service-one', getClientInfoOne);
// Endpoint untuk menghasilkan QR code
app.get('/generate-qr-service-one', startAuthenticationOne);
// Endpoint untuk kirim pesan pada service one
app.post('/send-service-one', sendWaServiceOne)

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Service 1 (one) is running on port ${PORT}`);
});