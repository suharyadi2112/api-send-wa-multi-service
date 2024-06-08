const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const {startAuthenticationOne, getClientInfoOne, sendWaServiceOne} = require('./service_one');


const app = express();
const clientInfo = getClientInfoOne();

app.use(bodyParser.json());

app.get('/status-service-one', (req, res) => {
    if (clientInfo) {
        res.json(clientInfo);
    } else {
        res.status(404).send('Client on service one not initialized');
    }
});

app.get('/generate-qr-service-one', (req, res) => {
    if (!clientInfo) {
        console.log('waiting new qr service one....:');
        startAuthenticationOne(); 
    }
    res.send('Please check your console for the QR code service one to scan.');
});

app.post('/send-service-one', sendWaServiceOne);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Service 1 (one) is running on port ${PORT}`);
});