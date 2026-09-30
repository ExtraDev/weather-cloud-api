import bodyParser from "body-parser";
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Router } from "express";
import { createServer } from "http";
import { initDatabase } from "./common/database/init-database";
import weatherRoutes from "./weather/weather.routes";

/* ======================== */
initDatabase();

dotenv.config();

const app = express();

const corsOptions: cors.CorsOptions = {
    origin: [
        'http://localhost:4200',
    ]
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

const router = Router();
weatherRoutes(router);

app.use("/", router);

const httpServer = createServer(app);
httpServer.listen(8080, () => {
    console.log(`Server is running on 8080`);
});