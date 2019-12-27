const dotenv = require("dotenv");
const logger = require("../logger");

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const envFound = dotenv.config();

if (!envFound) {
    throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const config = {
    port: parseInt(process.env.PORT),
    mqtt: {
        url: process.env.MQTT_URL,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD
    },
    database: {
        host: process.env.DATABASE_HOST,
        name: process.env.DATABASE_NAME,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD
    }
};

logger.info(`Load config: ${JSON.stringify(config)}`);

module.exports = config;
