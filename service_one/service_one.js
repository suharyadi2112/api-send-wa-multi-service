const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = false;

async function initializeClientOne() {

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
  
    client.on('authenticated', () => {
        console.log('Client successfully authenticated');
    });

    client.on('auth_failure', msg => {
        // Fired if session restore was unsuccessful
        console.error('AUTHENTICATION FAILURE', msg);
    });
    

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
    });
    
    client.on('disconnected', async (reason) => {
        await client.destroy() .then(response => {
            console.log('Client was logged out', reason);
        })
        .catch(error => {
            console.error(`Failed to destory client: ${error.message}`);
        });
        await initializeClientOne();
    });

}

function startAuthenticationOne(req, res) {
    console.log(client)
    if (!client) {
        initializeClientOne();
        client.initialize();
        console.log('Please check your console for the QR code service one to scan.');
        res.send('Please check your console for the QR code service one to scan.');
    } else {
        console.log('Client is already initialized');
        res.send('Client already initialized. No need to generate QR code again.');
    }
}

async function getClientInfoOne(req, res) {
    console.log(client.info)
    if (!client.info) {
        console.log('Not login service one');
        res.send('Not login service one');
    } else {
        console.log('Already login service one.');
        res.send('Already login service one.');
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
        return res.status(400).json({ error: resMsg });
    }

    const chatId = req.body.no_hp.substring(1) + '@c.us'; // wajib +62 kayanya

    console.log(req.body, "tess");
    if (!client) {
        console.log('WhatsApp client is not initialized');
        return res.status(500).send('WhatsApp client is not initialized');
    }

   await client.sendMessage(chatId, isi_pesan)
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
    startAuthenticationOne,
    getClientInfoOne,
    sendWaServiceOne,
};

