import express, { json } from "express";
import routes from "./routes/routes.js"; // Importa el router
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import http from "http";
import https from "https";
import { APP_PORT } from "./config.js";
import CheckTime from "./functions/CheckTime.js";
import cron from "node-cron";

const app = express(); // --> Iniciamos express
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.disable("x-powered-by"); // --> Deshabilitar el header x-powered-by

app.use("/subasta", routes);

app.use(function (req, res, next) {
  res.status(404).send("Route not found");
});

const options = {
  key: fs.readFileSync("certs/privkey.pem"),
  cert: fs.readFileSync("certs/cert.pem"),
};

setInterval(() => {
  CheckTime.checkTime();
}, 5000);

http.createServer(app).listen(80);
https.createServer(options, app).listen(APP_PORT);
console.log("Server on port", APP_PORT);

// --> Usar la variable de entorno PORT, si no usar el port 3000
