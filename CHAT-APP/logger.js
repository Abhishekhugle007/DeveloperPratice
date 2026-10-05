const winston = require("winston");

const logger = winston.createLogger({
    level: "info",

    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),

    transports: [
        new winston.transports.Console()
    ]
});

if (require.main === module) {
    logger.info("Logger is working");
}

module.exports = logger;
