const mysql = require("mysql2");
const { database } = require("../config");
// create the pool
const pool = mysql.createPool({
    host: database.host,
    user: database.username,
    password: database.password,
    database: database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// now get a Promise wrapped instance of that pool
const promisePool = pool.promise();

module.exports = promisePool;
