const express = require("express");
const app = express();
const expressHbs = require("express-handlebars");
const bodyParser = require("body-parser");
const { data, clientMQTT } = require("./mqtt");
const config = require("./config");
const logger = require("./logger");
const db = require("./database");
const bcrypt = require("bcrypt");

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
                    "INSERT INTO place (name, code, img) VALUES (?, ?, ?)",
                    [name, code, img]
                );
                data[code] = {
                    id: result[0].insertId,
                    name,
                    code,
                    img,
                    temperature: 0,
                    humidity: 0
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

app.post("/api/light", (req, res) => {
    res.json(req.body);
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
