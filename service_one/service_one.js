const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('../config/logger');//log

let client = false;

async function initializeClientOne(qrr = false, authen = false) {

    client = new Client({
        puppeteer: {
            headless: true,
            // executablePath: '/usr/bin/chromium-browser', // Uncomment for Ubuntu server
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        authStrategy: new LocalAuth(),
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        }
    });
    
    if (authen) { //reconnecting
        client.on('authenticated', () => {
            logger.info('Client on service one successfully authenticated');
        });
        
        
        client.on('auth_failure', msg => {
            // Fired if session restore was unsuccessful
            logger.error('AUTHENTICATION FAILURE ON SERVICE ONE', msg);
        });
    }
    client.on('ready', () => {
        try {
            logger.info('Client is ready on service one!');
        } catch (error) {
            logger.error('FAIL CLIENT READY ON SERVICE ONE:', error);
        }
    });

    if (qrr) { //generate qr
        client.on('qr', qr => {
            try {
                qrcode.generate(qr, { small: true });
                logger.info('Generate again qr code')
            } catch (error) {
                logger.error('FAIL GENERATE QR ON SERVICE ONE!', error);
            }
        });
    }
    
    client.on('disconnected', async (reason) => {
        await client.destroy() .then(response => {
            logger.info('Client on service one was logged out', reason);
        })
        .catch(error => {
            logger.error(`FAILED TO DESTROY CLIENT ON SERVICE ONE: ${error.message}`);
        });
        await initializeClientOne();
    });

}

async function startAuthenticationOne(req, res) {// generate code qr
    if (!client) {
        await initializeClientOne(true, false);
        client.initialize();
        logger.info('Please check your console for the QR code service one to scan.....');
        res.send('Please check your console for the QR code service one to scan.....');
    } else {
        if (!client.info) {// antisipasi jika logout dari hp, karena disconnect destroy(), hanya menghilangkan client info, bukan client secara keseluruhan
            await initializeClientOne(true, false);
            client.initialize();
            logger.info('Please check your console for the QR code service one to scan.....');
            res.send('Please check your console for the QR code service one to scan.....');
        }else{
            logger.info('Client is already initialized');
            res.send('Client already initialized. No need to generate QR code again.');
        }
    }
}

async function getClientInfoOne(req, res) {//cek info login
    logger.info(client.info)
    if (!client.info) {
        logger.warn('Not login service one');
        res.send('Not login service one');
    } else {
        logger.info('Already login service one.');
        res.send('Already login service one.');
    }
}

async function getReconnecting(req, res) {//reconnecting
    logger.info(client.info)
    if (!client.info) {
        await initializeClientOne(false, true);
        client.initialize();
        logger.warn('Reconnecting.....');
        res.send('Reconnecting.....');
    } else {
        logger.info('Already connect before service one.');
        res.send('Already connect before service one.');
    }
}



async function sendWaServiceOne(req, res) {
    const { no_hp, isi_pesan, fileOrImageUrl } = req.body;

    let resMsg = '';
    let valid = 1;

    if (!no_hp) {
        resMsg += 'No Hp harus Diisi. ';
        valid = 0;
    } else {
        // Lakukan pembersihan dan penyesuaian nomor HP di sini
        let cleanedno_hp = no_hp.trim().replace(/[^0-9]+/g, '');
        if (cleanedno_hp.startsWith('0')) {
            cleanedno_hp = '+62' + cleanedno_hp.substring(1);
        } else if (!cleanedno_hp.startsWith('62')) {
            resMsg += `No Hp tidak valid (${no_hp}). `;
            valid = 0;
        }
        req.body.no_hp = cleanedno_hp;
    }

    if (!isi_pesan && !fileOrImageUrl) {
        resMsg += 'Parameter message atau fileOrImageUrl harus diisi. ';
        valid = 0;
    }

    if (valid === 0) {
        logger.error('failed request send message on service one', resMsg)
        return res.status(400).json({ error: resMsg });
    }

    const chatId = req.body.no_hp.substring(1) + '@c.us'; // wajib +62 kayanya

    logger.info(req.body, "payload pesan");

    if (!client.info) {
        logger.warn('WhatsApp client is not initialized');
        return res.status(500).send('WhatsApp client is not initialized');
    }

    await client.sendMessage(chatId, isi_pesan)
        .then(response => {
            res.status(200).json({
                status: 'success',
                data: req.body,
                message: 'Message sent successfully to ${no_hp} on service one.'
            });
            logger.info(`Message sent successfully to ${no_hp} on service one`);
        })
        .catch(error => {
            res.status(500).send(`Failed to send message: ${error.message} on service one`);
            logger.error(`Failed to send message: ${error.message} on service one`);
        });
}

module.exports = {
    startAuthenticationOne,
    getClientInfoOne,
    sendWaServiceOne,
    getReconnecting,
};