const express = require("express");
const app = express();
const expressHbs = require("express-handlebars");
const bodyParser = require("body-parser");
const { data, clientMQTT, mapIdToCode, decisionTreeData } = require("./mqtt");
const config = require("./config");
const logger = require("./logger");
const db = require("./database");
const bcrypt = require("bcrypt");
const moment = require("moment");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));

app.engine(
    "hbs",
    expressHbs({
        extname: "hbs",
        defaultLayout: "layout",
        layoutsDir: __dirname + "/views/layouts/",
        partialsDir: __dirname + "/views/partials/"
    })
);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/place", (req, res) => {
    res.render("place");
});

app.post("/place", async (req, res) => {
    let { name, code, img, secret } = req.body;
    if (
        name === undefined ||
        code === undefined ||
        secret === undefined ||
        name === "" ||
        code === "" ||
        secret === ""
    ) {
        logger.error(`Invail input ${JSON.stringify(req.body)}`);
        res.status(400).json({
            code: 0,
            message: "Invalid input"
        });
    } else {
        if (!bcrypt.compareSync(secret, config.secret)) {
            logger.error(`Wrong secret key: ${secret}`);
            res.status(400).json({
                code: 0,
                message: "Wrong Secret Key"
            });
        } else {
            img = img === undefined ? "" : img;
            try {
                const result = await db.query(
                    "INSERT INTO place (name, code, codeEsp, img) VALUES (?, ?, ?, ?)",
                    [name, code, `${code}-esp`, img]
                );
                data[code] = {
                    id: result[0].insertId,
                    name,
                    code,
                    img,
                    temperature: 0,
                    humidity: 0,
                    codeEsp: `${code}-esp`
                };

                logger.info(`Add place: ${JSON.stringify(data[code])}`);
                clientMQTT.subscribe(code);
                logger.info(`Subcribe ${code}`);

                res.json({
                    code: 1,
                    message: "Inserted successfully!!!"
                });
            } catch (err) {
                logger.error(err);
                res.status(400).json({
                    code: 0,
                    message: "Code is duplicated"
                });
            }
        }
    }
});

app.post("/api/light", async (req, res) => {
    let { id, placeId, lightStatus } = req.body;

    if (
        id === undefined ||
        placeId === undefined ||
        lightStatus === undefined ||
        id === "" ||
        lightStatus === "" ||
        placeId === ""
    ) {
        logger.error(`Invaild input: ${JSON.stringify(req.body)}`);
        res.status(400).json({
            code: 0,
            message: "Invalid input"
        });
    } else {
        try {
            id = parseInt(id);
            placeId = parseInt(placeId);
            lightStatus = parseInt(lightStatus);

            const sqlTimestamp = `
                SELECT logTime
                FROM temp_humi_log
                WHERE id = ? AND placeId = ?
            `;

            const sqlUpdate = `
                UPDATE temp_humi_log
                SET lightStatus = ?, auto = 0
                WHERE TIMESTAMPDIFF(SECOND, logTime, ?) < 150
                AND TIMESTAMPDIFF(SECOND, logTime, ?) >= 0
                AND placeId = ?
            `;

            const resultTimestamp = await db.query(sqlTimestamp, [id, placeId]);
            const time = moment(resultTimestamp[0][0].logTime).format(
                "YYYY-MM-DD HH:mm:ss"
            );

            const resultUpdate = await db.query(sqlUpdate, [
                lightStatus,
                time,
                time,
                placeId
            ]);

            const code = mapIdToCode[placeId].code;

            logger.info(
                `Update light status, code: ${code}, lightStatus: ${lightStatus}, affectedRows: ${resultUpdate[0].affectedRows}`
            );

            data[code] = {
                ...data[code],
                lightStatus
            };

            clientMQTT.publish(data[code].codeEsp, lightStatus + "");

            logger.info(
                `Publish to ${data[code].codeEsp}, lightStatus: ${lightStatus}`
            );
            decisionTreeData.count++;

            res.json({ message: "ok" });
        } catch (err) {
            logger.error(err);
            res.status(400).json({
                code: 0,
                message: "Invalid input or id not found"
            });
        }
    }
});

app.post("/api/data", (req, res) => {
    res.json({
        data: Object.values(data)
    });
});

app.set("view engine", "hbs");

app.listen(config.port, () => {
    logger.info("Server is listening on port " + config.port);
});
