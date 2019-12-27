const express = require("express");
const app = express();
const expressHbs = require("express-handlebars");
const bodyParser = require("body-parser");
const { data } = require("./mqtt");
const config = require("./config");
const logger = require("./logger");

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

app.post("/api/data", (req, res) => {
    res.json({
        data: Object.values(data)
    });
});

app.set("view engine", "hbs");

app.listen(config.port, () => {
    logger.info("Server is listening on port " + config.port);
});
