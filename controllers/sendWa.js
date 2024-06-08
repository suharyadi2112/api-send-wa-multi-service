const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let clientSet;

function initializeClient() {

    const client = new Client({
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
  
    client.on('authenticated', () => {
        console.log('Client successfully authenticated');
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('qr', qr => {
        console.log('QR code received, please scan:');
        qrcode.generate(qr, { small: true });
    });


    client.on('disconnected', (reason) => {
        console.log('Client was logged out', reason);
        // Reinitialize client if disconnected
        initializeClient();
    });

    client.initialize();

    clientSet = client
}


function sendMessageWhatsAppOTPReservasi(req, res) {
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
        return res.status(400).json({ error: resMsg });
    }

    const chatId = req.body.no_hp.substring(1) + '@c.us'; // wajib +62 kayanya

    console.log(req.body, "tess");
    if (!client) {
        console.log('WhatsApp client is not initialized');
        return res.status(500).send('WhatsApp client is not initialized');
    }

    client.sendMessage(chatId, isi_pesan)
        .then(response => {
            res.send(`Message sent successfully to ${no_hp}`);
            console.log(`Message sent successfully to ${no_hp}`);
        })
        .catch(error => {
            res.status(500).send(`Failed to send message: ${error.message}`);
            console.error(`Failed to send message: ${error.message}`);
        });
}

module.exports = {
    clientSet,
    initializeClient,
    sendMessageWhatsAppOTPReservasi,
};

// Initialize the client when the script is first run
initializeClient();
