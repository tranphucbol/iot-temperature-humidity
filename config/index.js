let dotenv = require("dotenv");

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const envFound = dotenv.config();

if (!envFound) {
    throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

module.exports = {
    port: parseInt(process.env.PORT),
    mqtt: {
        url: process.env.MQTT_URL,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD
    }
};
