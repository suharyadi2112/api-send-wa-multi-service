const axios = require('axios');
const logger = require('../config/logger');//log

async function sendWaServiceBackup(req, res) {
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

    let data = JSON.stringify({
        "api_key": "apikey",
        "receiver": req.body.no_hp.substring(1),
        "data": {
        "message": isi_pesan
        }
    });
    
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://waf.etp.web.id/api/send-message',
        headers: { 
        'Content-Type': 'application/json'
        },
        data : data
    };
    
    axios.request(config)
    .then((response) => {
        const successMessage = {
            status: 'success',
            message: `Message sent successfully to ${no_hp} on service backup.`
        };
        res.status(200).json(successMessage);
        logger.info(`Response: ${JSON.stringify(successMessage, null, 2)}`);
        console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
        logger.error('Fail send message from service backup', error);
        console.log(error);
    });
  
}
module.exports = {
    sendWaServiceBackup,
};