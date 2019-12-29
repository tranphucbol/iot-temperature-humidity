const mqtt = require("mqtt");
const config = require("../config");
const { places } = config;
const db = require("../database");
const moment = require("moment");
const logger = require("../logger");
const DecisionTree = require('decision-tree'); 

const data = {};
let dataTrain =[];
let decisionTree;
let count = 0;

const client = mqtt.connect(config.mqtt.url, {
    username: config.mqtt.username,
    password: config.mqtt.password
});

(async () => {
    const sql = `
        SELECT p.*, thl.temperature, thl.humidity
        FROM place p LEFT JOIN temp_humi_log thl 
        ON p.id = thl.placeId
        WHERE NOT EXISTS (
            SELECT 1 
            FROM place pt, temp_humi_log thlt 
            WHERE pt.id = thlt.placeId 
            AND pt.id = p.id 
            AND thlt.logTime > thl.logTime)
        ORDER BY p.id`;
    const result = await db.query(sql);

    result[0].forEach(place => {
        place.temperature = place.temperature === null ? 0 : place.temperature;
        place.humidity = place.humidity === null ? 0 : place.humidity;
        data[place.code] = place;
    });

    logger.info(`Load data ${JSON.stringify(data)}`);

    const topics = Object.keys(data);
    topics.forEach(topic => client.subscribe(topic));
    logger.info(`Subscribe ${JSON.stringify(topics)}`);
    trainDecisionTree();
})();

client.on("message", async (topic, message) => {
    // message is Buffer
    if(count == 50){
        trainDecisionTree();
        count = 0;
    }
    if (data[topic] !== undefined) {
        const { temperature, humidity } = JSON.parse(message.toString());
        const time = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
        let predictLightStatus = decisionTree.predict({
            temperature: temperature,
            humidity: humidity,
            placeId: data[topic].id,
            noon: Math.floor(curHour/6)
        });
        await db.query(
            "INSERT INTO temp_humi_log (placeId, temperature, humidity, logTime, lightStatus) VALUES (?, ?, ?, ?, ?)",
            [data[topic].id, temperature, humidity, time, predictLightStatus]
        );
        data[topic] = {
            ...data[topic],
            temperature,
            humidity
        };
        logger.info(`topic: ${topic}, data: ${message.toString()}`);
    }
});

async function trainDecisionTree(){
    let sql = `
        SELECT thl.placeId, thl.temperature, thl.humidity, thl.logtime, thl.lightStatus
        FROM temp_humi_log thl 
        WHERE auto=0`;
    let result = await db.query(sql);
    let preData = result[0];
    preData.forEach(e =>{
        curHour = e.logtime.getHours();
        e.noon = Math.floor(curHour/6);
        delete e.logtime;
    })
    var features = ["placeId", "temperature", "humidity", "noon"];
    var class_name = "lightStatus";
    decisionTree = new DecisionTree(preData, class_name, features);
}



module.exports = {
    data,
    clientMQTT: client,
    count
};
