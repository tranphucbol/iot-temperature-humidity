const mqtt = require("mqtt");
const config = require("../config")

let data = {
    'lt': {
        location: 'Long Thành',
        temperature: 26.0,
        humidity: 80,
        img: "https://images.unsplash.com/photo-1444418185997-1145401101e0?format=auto&auto=compress&dpr=2&crop=entropy&fit=crop&w=1355&h=858&q=80"
    },
    'hcm': {
        location: 'Hồ Chí Minh',
        temperature: 27.0,
        humidity: 90,
        img: "https://images.unsplash.com/photo-1431620828042-54af7f3a9e28?format=auto&auto=compress&dpr=2&crop=entropy&fit=crop&w=1102&h=740&q=80"
    },
    'hn': {
        location: 'Hà Nội',
        temperature: 13.0,
        humidity: 50
    }
}

const client  = mqtt.connect(config.mqtt.url, {
    username: config.mqtt.username,
    password: config.mqtt.password
})

client.on("connect", function() {
    const topics = Object.keys(data);
    topics.forEach(topic => client.subscribe(topic))
    client.subscribe("test", function(err) {
        if (!err) {
            // client.publish("test", "Hello mqtt");
        }
    });
});

client.on("message", function(topic, message) {
    // message is Buffer

    if(data[topic] !== undefined) {
        const msg = JSON.parse(message.toString())
        data[topic] = {
            ...data[topic],
            temperature: msg.temperature,
            humidity: msg.humidity
        }
        console.log(`${new Date().getTime()} INFO:::: topic: ${topic}, data: ${message.toString()}`);
    }
});

module.exports = {
    data
};
