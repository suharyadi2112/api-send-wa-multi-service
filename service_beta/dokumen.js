const express = require('express');
const fetch = require('node-fetch');
const mysql = require('mysql2');
const logger = require('../config/logger');//log
const app = express();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Middleware untuk mengizinkan body JSON
app.use(express.json());

// Konfigurasi koneksi database MySQL
const dbConfig = {
    host: '192.168.0.30',
    user: 'root',
    password: 'S1metr1s30!',
    database: 'simetris_wa'
};

// Buat koneksi ke database
const connection = mysql.createConnection(dbConfig);

// Fungsi untuk mengambil pesan dari database
function fetchMessages() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * 
            FROM outbox_rat 
            WHERE status = 0 
                AND application = 'Dokumen SKDP' 
            ORDER BY insertDateTime ASC 
            LIMIT 1;
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
        // Download file
        let getFile = await getFilePdf(pesan.file);

        if (getFile) {
            
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
    
            const downloadFolder = path.resolve(__dirname, 'pdff');
            const fileName = path.basename(new URL(pesan.file).pathname); 
            const filePath = path.join(downloadFolder, fileName);

            let data = new FormData();
            
            // Pastikan file ada sebelum mengirim
            if (fs.existsSync(filePath)) {

                // Buat stream untuk membaca file
                const readStream = fs.createReadStream(filePath);

                // Tangani event pada stream
                readStream.on('open', () => {
                    console.log(`File stream dibuka dengan id '-' ${pesan.id_outbox}`);
                });

                readStream.on('end', () => {
                    console.log(`File stream selesai dibaca dengan id '-' ${pesan.id_outbox}`);
                });

                readStream.on('error', (err) => {
                    logger.error(`Gagal membaca file: dengan id ${err} '-' ${pesan.id_outbox}`);
                });

                data.append('phone', `${fixHp}@s.whatsapp.net`);//fixHp
                data.append('caption', getRandomTextFile() + "\n\n" + pesan.messages);//caption
                data.append('file', readStream);

                const fileSize = fs.statSync(filePath).size;
                console.log(fileSize)

                const requestOptions = {
                    method: "POST",
                    body: data,
                    redirect: "follow"
                  };
                  
                const response = await fetch("http://192.168.0.40:3000/send/file", requestOptions)
                const responseData = await response.json();

                console.log(responseData)

                codeStatus = responseData.code;
                messageStatus = responseData.message;

                if (codeStatus === "SUCCESS") {
                    const updateQuery = `UPDATE outbox_rat SET status = 1 WHERE id_outbox = ?`;
                    connection.query(updateQuery, [pesan.id_outbox], (error, results) => {
                        if (error) {
                            logger.error('Gagal mengupdate status 1', error);
                        } else {
                            logger.info(`Pesan berhasil dikirim dengan id pesan: ${pesan.id_outbox}`);
                        }
                    });
                } else {

                    const updateFailQuery = `
                        UPDATE outbox_rat 
                        SET 
                            status = 2,
                            msg_error = '${messageStatus}'
                        WHERE id_outbox = ?
                    `;
                    connection.query(updateFailQuery, [pesan.id_outbox], (error, results) => {
                        if (error) {
                            logger.error('Gagal mengupdate status 2', error);
                        } else {
                            logger.info(`Status pesan berhasil diupdate 2 karena gagal dengan id pesan: ${pesan.id_outbox}`);
                        }
                    });

                    logger.error(`Gagal mengirim pesan: ${messageStatus}, ${pesan.id_outbox}`);
                }

                fs.unlink(filePath, () => {});//hapus file

            } else {
                logger.error(`File tidak ditemukan: ${pesan.id_outbox}`);
            }
        }else{
            logger.error(`Gagal Download File: ${pesan.id_outbox}`);
        }
    } catch (error) {
        logger.error('Error:', error);
    }
}

// Jalankan proses pengiriman pesan setelah server siap
app.listen(3001, async () => {
    console.log(`Server berjalan di http://localhost:3001`);

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
        await sleep(5000);
    }
});

// Fungsi untuk jeda
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getFilePdf(pdfUrl) {
    const downloadFolder = path.resolve(__dirname, 'pdff');
    const fileName = path.basename(new URL(pdfUrl).pathname);
    const filePath = path.join(downloadFolder, fileName);

    if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder);
    }

    const writer = fs.createWriteStream(filePath);

    try {
        const response = await axios({
            method: 'get',
            url: pdfUrl,
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            response.data.pipe(writer);

            writer.on('finish', () => {
                writer.close(() => {
                    console.log('File berhasil diunduh');
                    resolve(true);
                });
            });

            writer.on('error', (error) => {
                logger.error('Kesalahan saat menulis file:', error);
                fs.unlink(filePath, () => {}); 
                reject(false); 
            });
        });
    } catch (error) {
        logger.error('Gagal mendownload file:', error);
        fs.unlink(filePath, () => {}); 
        return false;
    }
}

function getRandomTextFile() {
    const captions = [
        "Dokumen yang relevan telah disertakan dalam lampiran.",
        "Berikut ini adalah berkas yang diperlukan.",
        "Silakan lihat dokumen terlampir untuk informasi lebih lanjut.",
        "Dokumen penting telah disiapkan dan dapat diakses di bawah ini.",
        "File yang diperlukan telah tersedia untuk referensi.",
        "Silakan tinjau lampiran yang berisi dokumen terkait.",
        "File relevan untuk keperluan ini telah disertakan.",
        "Berkas yang dibutuhkan dapat ditemukan pada lampiran berikut.",
        "Dokumen yang diperlukan sudah siap untuk diperiksa.",
        "Lampiran ini berisi informasi penting yang diperlukan.",
        "Berkas terlampir mencakup dokumen yang relevan.",
        "Dokumen terkait telah disiapkan dalam lampiran ini.",
        "File yang diperlukan telah disertakan dalam dokumen terlampir.",
        "Berikut adalah berkas yang berguna.",
        "Lampiran ini mencakup semua dokumen relevan.",
        "Silakan periksa lampiran untuk berkas yang diperlukan.",
        "Dokumen terkait telah dilampirkan dan siap untuk ditinjau.",
        "Berkas yang diperlukan bisa ditemukan pada lampiran ini.",
        "Berikut adalah lampiran berisi dokumen yang diperlukan."
      ];
      
    
    return captions[Math.floor(Math.random() * captions.length)];
}