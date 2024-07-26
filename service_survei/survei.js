const express = require('express');
const fetch = require('node-fetch');
const mysql = require('mysql2');
const logger = require('../config/logger');//log
const app = express();

// Middleware untuk mengizinkan body JSON
app.use(express.json());


const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'survei_blast'
};

// Buat koneksi ke database
const connection = mysql.createConnection(dbConfig);

// Fungsi untuk mengambil pesan dari database
function fetchMessages() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * 
            FROM outbox_survei_juli_dua 
            WHERE status = 0 
                AND application = 'survei' 
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
        
        // Susun pesan
        const pesanFix = `${getRandomTextFile()}\n\n`+
        `*Kpd Yth : Bpk/Ibu/Sdr/I Pasien RSUD Raja Ahmad Thabib*\n\n`+
        `Kami, *Bidang Diklat dan Litbang* (Penelitian dan Pengembangan) *RSUD Raja Ahmad Tabib* saat ini sedang melakukan survei mengenai: \n\n`+
        `*Judul Survei:*\n`+
        `SURVEI PERSEPSI ANTI KORUPSI (PAK) *RSUD RAJA AHMAD TABIB TAHUN 2024*\n\n`+
        `*Tujuan Survei:*\n`+
        `Untuk mengukur indeks persepsi anti korupsi oleh Masyarakat sebagai penerima layanan di *RSUD Raja Ahmad Tabib*.\n\n`+
        `*Untuk mengisi survei, silakan klik tautan berikut:*\n`;
        
        const raw = JSON.stringify({
            "phone": `${fixHp}@s.whatsapp.net`,
            // "phone": `6285172462751@s.whatsapp.net`,
            "link": "http://bit.ly/SURVEI_RSUD_RAJA_AHMAD_TABIB_TAHUN2024",
            "caption": pesanFix
        });
        
        const requestOptions = {
            method: "POST",
            body: raw,
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            redirect: "follow"
        };

    

        //pilih acak url
        const selectedUrl = urls[Math.floor(Math.random() * urls.length)];

        const response = await fetch(selectedUrl, requestOptions)
        const responseData = await response.json();

        console.log(responseData)

        codeStatus = responseData.code;
        messageStatus = responseData.message;

        if (codeStatus === "SUCCESS") {
            const updateQuery = `UPDATE outbox_survei_juli_dua SET status = 1 WHERE id_outbox = ?`;
            connection.query(updateQuery, [pesan.id_outbox], (error, results) => {
                if (error) {
                    logger.error('Gagal mengupdate status 1', error);
                } else {
                    logger.info(`Pesan berhasil dikirim dengan id pesan: ${pesan.id_outbox}`);
                }
            });
        } else {
            const updateFailQuery = `
                UPDATE outbox_survei_juli_dua 
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
    } catch (error) {
        logger.error('Error:', error);
    }
}

// Jalankan proses pengiriman pesan setelah server siap
app.listen(3002, async () => {
    console.log(`Server berjalan di http://localhost:3002`);

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
        const randomInterval = getRandomInterval();
        await sleep(randomInterval);
    }
});

// Fungsi untuk jeda
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomTextFile() {

    const captions = [
        "Salam sejahtera untuk Anda semua.",
        "Semoga hari Anda penuh kebahagiaan.",
        "Kami mengucapkan terima kasih atas partisipasi Anda.",
        "Kami sangat menghargai waktu yang Anda luangkan.",
        "Kami berharap Anda dalam kondisi yang baik.",
        "Kami merasa terhormat dapat bekerja sama dengan Anda.",
        "Mohon perhatian dan kerjasama Anda dalam survei ini.",
        "Harapan kami adalah hasil survei ini dapat memberikan manfaat.",
        "Kami akan sangat berterima kasih atas tanggapan Anda.",
        "Masukan Anda sangat kami hargai.",
        "Terima kasih atas kerjasama dan kontribusi Anda.",
        "Kami menghargai setiap jawaban yang Anda berikan dengan sepenuh hati.",
        "Kami mengucapkan terima kasih atas dukungan dan kerjasama Anda.",
        "Mohon luangkan waktu sejenak untuk mengisi survei ini.",
        "Kami sangat menghargai saran dan kritik yang Anda berikan.",
        "Terima kasih atas kesediaan Anda untuk berpartisipasi.",
        "Kami berharap survei ini tidak mengganggu kegiatan Anda sehari-hari.",
        "Semoga Anda selalu dalam keadaan sehat dan bahagia.",
        "Kami sangat menantikan jawaban Anda dengan penuh antusias."
    ];
     
    
    return captions[Math.floor(Math.random() * captions.length)];
}

function getRandomInterval() {
    const intervals = [3000, 4000, 5000, 6000];
    const randomIndex = Math.floor(Math.random() * intervals.length);
    return intervals[randomIndex];
}