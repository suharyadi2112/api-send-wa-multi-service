const express = require('express');
const router = express.Router();
const sampleController = require('../controllers/sampleController');
const { clientSet, initializeClient, sendMessageWhatsAppOTPReservasi  }  = require('../controllers/sendWa');

router.post('/send', sendMessageWhatsAppOTPReservasi);
// Endpoint untuk memeriksa status login
router.get('/status', (req, res) => {
    if (clientSet.info && clientSet.info.wid) {
        res.json({ status: 'logged_in', user: clientSet.info.wid.user });
    } else {
        res.json({ status: 'not_logged_in' });
    }
});

router.get('/generate-qr', (req, res) => {

    console.log(clientSet)
    if (!clientSet) {
        console.log('waiting new qr....:');
        initializeClient();
    }
    res.send('Please check your console for the QR code to scan.');
});
module.exports = router;
