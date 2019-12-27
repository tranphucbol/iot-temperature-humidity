const mqtt = require("mqtt");
const config = require("../config");
const { places } = config;
const db = require("../database");
const moment = require("moment");
const logger = require("../logger")

const data = {};

const client = mqtt.connect(config.mqtt.url, {
    username: config.mqtt.username,
    password: config.mqtt.password
});

(async () => {
    const sql = `
        SELECT p.*, thl.temperature, thl.humidity
        FROM place p, temp_humi_log thl
        WHERE p.id = thl.placeId
        AND NOT EXISTS (
            SELECT 1 
            FROM place pt, temp_humi_log thlt 
            WHERE pt.id = thlt.placeId 
            AND pt.id = p.id 
            AND thlt.logTime > thl.logTime)
        ORDER BY p.id`;
    const result = await db.query(sql);

    result[0].forEach(place => {
        data[place.code] = place;
    });

    logger.info(`Load data ${JSON.stringify(data)}`)

    const topics = Object.keys(data);
    topics.forEach(topic => client.subscribe(topic));
    logger.info(`Subscribe ${JSON.stringify(topics)}`)
})();

client.on("message", async (topic, message) => {
    // message is Buffer

    if (data[topic] !== undefined) {
        const { temperature, humidity } = JSON.parse(message.toString());
        const time = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
        await db.query(
            "INSERT INTO temp_humi_log (placeId, temperature, humidity, logTime) VALUES (?, ?, ?, ?)",
            [data[topic].id, temperature, humidity, time]
        );
        data[topic] = {
            ...data[topic],
            temperature,
            humidity
        };
        logger.info(`topic: ${topic}, data: ${message.toString()}`)
    }
});

module.exports = {
    data
};
