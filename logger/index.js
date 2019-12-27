const moment = require('moment');

const log = (level, message) => {
    const time = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
    console.log(`\x1b[35m${time}\x1b[0m ${level} ${message}`);
}

module.exports = {
    info: (message) => log('\x1b[34mINFO::::\x1b[0m', message),
    warn: (message) => log('\x1b[33mWARN::::\x1b[0m', message),
    error: (message) => log('\x1b[31mERROR::::\x1b[0m', message),
}