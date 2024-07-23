const express = require('express');
const fetch = require('node-fetch');
const mysql = require('mysql2');
const logger = require('../config/logger');//log
const app = express();
const fs = require('fs');
const path = require('path');

// Middleware untuk mengizinkan body JSON
app.use(express.json());

// Konfigurasi koneksi database MySQL


// Buat koneksi ke database
const connection = mysql.createConnection(dbConfig);

// Fungsi untuk mengambil pesan dari database
function fetchMessages() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * 
            FROM outbox 
            WHERE status = 0 
                AND (application = 'kliksardjitootp' OR application = 'simetris.rss' OR application = 'reservasi-revisi-berkas') 
            ORDER BY insertDateTime ASC 
            LIMIT 1
        `;

        connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// Proses pengiriman pesan
async function sendMessage(pesan) {
    try {

        let fixHp = ""
        if (!pesan.destination) {
            logger.error(`No Hp harus Diisi : ${pesan.id_outbox}. `);
        } else {
            // Lakukan pembersihan dan penyesuaian nomor HP di sini
            let cleanedno_hp = pesan.destination.trim().replace(/[^0-9]+/g, '');
            if (cleanedno_hp.startsWith('0')) {
                cleanedno_hp = '62' + cleanedno_hp.substring(1);
                fixHp = cleanedno_hp;
            } else if (cleanedno_hp.startsWith('62')) {
                fixHp = cleanedno_hp; // Jika sudah dalam format 62, biarkan seperti itu
            } else {
                logger.error(`No Hp tidak valid (${pesan.destination}). `);
            }            
        }

        console.log(fixHp, "cekkkk")
        // Kirim pesan menggunakan API eksternal (contoh menggunakan fetch)
        const apiKeys =  ['f6c0fa22e5b01db0570295a1f9e9017ca5adf8c7','67fc2465fb2a69d63de63f9f287f93d9d170ab5f','e9876f475abc23457b7090fce985feb36f453e5d'];
     
        const selectedApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

        const body = {
            api_key: selectedApiKey,
            // receiver: pesan.destination,
            receiver: fixHp,
            data: {
                message: pesan.messages
            }
        };

        const response = await fetch('https://ratwa.my.id/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            body: JSON.stringify(body)
        });
        const responseData = await response.json();

        // Periksa status pengiriman
        const status = responseData.status;
        // const status = true;
        console.log(fixHp)
        if (status === true) {
            // Jika pengiriman sukses, update status di database

            const updateQuery = `UPDATE outbox_rat SET status = 1 WHERE id_outbox = ?`;
            connection.query(updateQuery, [pesan.id_outbox], (error, results) => {
                if (error) {
                    logger.error('Gagal mengupdate status 1', error);
                } else {
                    logger.info(`Pesan berhasil dikirim dengan id pesan: ${pesan.id_outbox}`);
                }
            });
        } else {

            // const updateFailQuery = `UPDATE outbox SET status = 2 WHERE id_outbox = ?`;
            const updateFailQuery = `
                UPDATE outbox_rat 
                SET 
                    status = 2,
                    msg_error = '${responseData.message}'
                WHERE id_outbox = ?
            `;
            connection.query(updateFailQuery, [pesan.id_outbox], (error, results) => {
                if (error) {
                    logger.error('Gagal mengupdate status 2', error);
                } else {
                    logger.info(`Status pesan berhasil diupdate 2 karena gagal dengan id pesan: ${pesan.id_outbox}`);
                }
            });

            logger.error(`Gagal mengirim pesan: ${responseData.message}, ${pesan.id_outbox}`);
        }

    } catch (error) {
        logger.error('Error:', error);
    }
}

// Jalankan proses pengiriman pesan setelah server siap
app.listen(2233, async () => {
    console.log(`Server berjalan di http://localhost:2233`);

    // Proses pengiriman pesan secara otomatis
    let numOfcek = 0;
    while (true) {
        try {
            // Ambil pesan pertama dengan status = 0 dari database
            const messages = await fetchMessages();

            if (messages.length > 0) {
                await sendMessage(messages[0]);
            } else {
                console.log('Tidak ada pesan yang perlu dikirim saat ini.');
            }
        } catch (error) {
            logger.error('Error saat mengambil data pesan:', error);
        }
        numOfcek++
        // Jeda selama 3 detik sebelum iterasi berikutnya
        await sleep(3000); // 3000 milidetik = 3 detik
    }
});

// Fungsi untuk jeda
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
