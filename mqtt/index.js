const mqtt = require("mqtt");
const config = require("../config");
const { places } = config;
const db = require("../database");
const moment = require("moment");
const logger = require("../logger");
const DecisionTree = require("decision-tree");

const data = {};
let decisionTree = null;
const mapIdToCode = {};
const decisionTreeData = {
    count: 0
}

const client = mqtt.connect(config.mqtt.url, {
    username: config.mqtt.username,
    password: config.mqtt.password
});

client.on('connect', () => {
    client.subscribe("greeting");
});

(async () => {
    const sql = `
        SELECT p.*, thl.temperature, thl.humidity, thl.lightStatus, thl.id AS logId
        FROM place p LEFT JOIN temp_humi_log thl 
        ON p.id = thl.placeId
        WHERE NOT EXISTS (
            SELECT 1 
            FROM place pt, temp_humi_log thlt 
            WHERE pt.id = thlt.placeId 
            AND pt.id = p.id 
            AND thlt.logTime > thl.logTime)
        ORDER BY p.id`;

    const countSql = 
    `   
        SELECT COUNT(*) as count
        FROM temp_humi_log
        WHERE auto = 1;
    `

    const [resultCount, result] = await Promise.all([db.query(countSql), db.query(sql)]);
    
    decisionTreeData.count = resultCount[0][0].count % 50;

    logger.info(`Current count: ${decisionTreeData.count}`);


    result[0].forEach(place => {
        place.temperature = place.temperature === null ? 0 : place.temperature;
        place.humidity = place.humidity === null ? 0 : place.humidity;
        place.lightStatus = place.lightStatus === null ? 0 : place.lightStatus;
        place.logId = place.logId === null ? 0 : place.logId;
        data[place.code] = place;
        mapIdToCode[place.id] = { code: place.code };
    });

    logger.info(`Load data ${JSON.stringify(data)}`);

    const topics = Object.keys(data);
    topics.forEach(topic => client.subscribe(topic));
    logger.info(`Subscribe ${JSON.stringify(topics)}`);
    trainDecisionTree();
})();

client.on("message", async (topic, message) => {
    // message is Buffer
    if (decisionTreeData.count == 50) {
        trainDecisionTree();
        decisionTreeData.count = 0;
    }

    if(topic === "greeting") {
        logger.info(`${message} connected`);
    }

    if (data[topic] !== undefined) {
        const { temperature, humidity } = JSON.parse(message.toString());
        const time = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");


        let lightStatus = data[topic].lightStatus;

        if(decisionTree !== null) {
            lightStatus = decisionTree.predict({
                temperature: temperature,
                humidity: humidity,
                placeId: data[topic].id,
                noon: Math.floor(new Date().getHours() / 6)
            });
        }

        if(temperature < data[topic].temperature + 2 && temperature > data[topic].temperature - 2 
            && humidity < data[topic].humidity + 5 && humidity > data[topic].humidity - 5) {
            lightStatus = data[topic].lightStatus;
        }

        const result = await db.query(
            "INSERT INTO temp_humi_log (placeId, temperature, humidity, logTime, lightStatus) VALUES (?, ?, ?, ?, ?)",
            [data[topic].id, temperature, humidity, time, lightStatus]
        );
        data[topic] = {
            ...data[topic],
            temperature,
            humidity,
            lightStatus,
            logId: result[0].insertId
        };

        client.publish(data[topic].codeEsp, lightStatus + "");

        if(decisionTree !== null) {
            logger.info(`Received from ${topic}, data: ${JSON.stringify({temperature, humidity})}, predictLightStatus: ${lightStatus}`)
        } else {
            logger.info(`Received from ${topic}, data: ${JSON.stringify({temperature, humidity})}, lightStatus: ${lightStatus}`)
        }
        
    }
});

async function trainDecisionTree() {
    let sql = `
        SELECT thl.placeId, thl.temperature, thl.humidity, thl.logtime, thl.lightStatus
        FROM temp_humi_log thl 
        WHERE auto=1`;
    let result = await db.query(sql);
    let preData = result[0];
    if(preData.length !== 0) {
        preData.forEach(e => {
            curHour = e.logtime.getHours();
            e.noon = Math.floor(curHour / 6);
            delete e.logtime;
        });
        var features = ["placeId", "temperature", "humidity", "noon"];
        var class_name = "lightStatus";
        decisionTree = new DecisionTree(preData, class_name, features);
        logger.info(`Build tree successfully`);
    }
}

module.exports = {
    data,
    mapIdToCode,
    clientMQTT: client,
    decisionTreeData
};
