const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Konfigurasi logger
const logger = createLogger({
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} - ${level}: ${message}`)
    ),
    transports: [
        // Transport untuk mencetak log ke konsol
        new transports.Console(),
        new DailyRotateFile({
            filename: path.join(__dirname, '..', 'logs', '%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '1m', // maksimal 1MB per file
            maxFiles: '14d' // menyimpan log untuk 14 hari
        })
    ]
});

module.exports = logger;