const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('../config/logger');//log

let client = false;

async function initializeClienttwo(authen = false) {

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
            logger.info('Client on service two successfully authenticated');
        });
        
        
        client.on('auth_failure', msg => {
            // Fired if session restore was unsuccessful
            logger.error('AUTHENTICATION FAILURE ON SERVICE two', msg);
        });
    }
    client.on('ready', () => {
        try {
            logger.info('Client is ready on service two!');
        } catch (error) {
            logger.error('FAIL CLIENT READY ON SERVICE two:', error);
        }
    });

    
    client.on('disconnected', async (reason) => {
        await client.destroy() .then(response => {
            logger.info('Client on service two was logged out', reason);
        })
        .catch(error => {
            logger.error(`FAILED TO DESTROY CLIENT ON SERVICE two: ${error.message}`);
        });
        await initializeClienttwo();
    });

}

async function startAuthenticationtwo(req, res) {// generate code qr
    if (!client) {
        await initializeClienttwo(false);
        client.on('qr', qr => {
            try {
                qrcode.generate(qr, { small: true });
                logger.info('Generate again qr code')
            } catch (error) {
                logger.error('FAIL GENERATE QR ON SERVICE two!', error);
            }
        });
        client.initialize();
        const successMessage = {
            status: 'success',
            data : null,
            message: `Please check your console for the QR code service two to scan #1.....`
        };
        res.status(200).send(successMessage);
        logger.info(`Please check your console for the QR code service two to scan #1.....`);

    } else {

        if (!client.info) {// antisipasi jika logout dari hp, karena disconnect destroy(), hanya menghilangkan client info, bukan client secara keseluruhan
            // console.log(client) 
            await initializeClienttwo(false);
            client.on('qr', qr => {
                try {
                    qrcode.generate(qr, { small: true });
                    logger.info('Generate again qr code #2')
                } catch (error) {
                    logger.error('FAIL GENERATE QR ON SERVICE two  #2!', error);
                }
            });
            client.initialize();
            const successMessage = {
                status: 'success',
                data : null,
                message: `Please check your console for the QR code service two to scan #2.....`
            };
            res.status(200).send(successMessage);
            logger.info(`Please check your console for the QR code service two to scan #2.....`);
        }else{
            const successMessage = {
                status: 'success',
                data : null,
                message: `Client is already initialized on service two, No need to generate QR code again.`
            };
            res.status(200).send(successMessage);
            logger.info(`Client is already initialized on service two, No need to generate QR code again.`);
        }
    }
}

async function getClientInfotwo(req, res) {//cek info login
    logger.info(client.info)
    if (!client.info) {
        const errorMessage = {
            status: 'fail',
            data : null,
            message: `Not login service two.`
        };
        res.status(400).send(errorMessage);
        logger.warn(`Response: ${JSON.stringify(errorMessage)}`);
    } else {
        const successMessage = {
            status: 'success',
            data : client.info,
            message: `Already login service two.`
        };
        res.status(200).send(successMessage);
        logger.warn(`Response: ${JSON.stringify(successMessage, null, 2)}`);
    }
}

async function getReconnecting(req, res) {//reconnecting
    logger.info(JSON.stringify(client.info, null, 2))
    if (!client.info) {
        await initializeClienttwo(true);
        client.initialize();
        logger.info('Reconnecting.....');
        res.send('Reconnecting.....');
    } else {
        logger.info('Already connect before service two.');
        res.send('Already connect before service two.');
    }
}



async function sendWaServicetwo(req, res) {
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
        logger.error('failed request send message on service two', resMsg)
        return res.status(400).json({ error: resMsg });
    }

    const chatId = req.body.no_hp.substring(1) + '@c.us'; // wajib +62 kayanya
    if (!client.info) {
        const errorMessage = {
            status: 'fail',
            data : null,
            message: `WhatsApp client is not initialized`
        };
        res.status(400).send(errorMessage);
        logger.warn(`Response: ${JSON.stringify(errorMessage, null, 2)}`);
        return
    }

    await client.sendMessage(chatId, isi_pesan)
        .then(response => {
            const { id, body, type, from, to } = response._data;
            const successMessage = {
                status: 'success',
                data: { id, body, type, from, to },
                message: `Message sent successfully to ${no_hp} on service two.`
            };
            res.status(200).json(successMessage);
            logger.info(`Response: ${JSON.stringify(successMessage, null, 2)}`);
        })
        .catch(error => {
            const errorMessage = {
                status: 'error',
                data : null,
                message: `Failed to send message: ${error.message} on service two`
            };
            res.status(500).send(errorMessage);
            logger.error(`Response: ${JSON.stringify(errorMessage, null, 2)}`);
        });
}

module.exports = {
    startAuthenticationtwo,
    getClientInfotwo,
    sendWaServicetwo,
    getReconnecting,
};