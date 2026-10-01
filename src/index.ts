import bodyParser from "body-parser";
import cors from 'cors';
import express, { Request, Response, Router } from "express";
import { createServer } from "http";
import { initDatabase } from "./common/database/init-database";
import weatherRoutes from "./weather/weather.routes";

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

app.get("/", (req: Request, res: Response) => {
    res.status(200).json("Hello world!");
});

const httpServer = createServer(app);

initDatabase().then(() => {
    httpServer.listen(8080, () => {
        console.log(`Server is running on 8080`);
    });
}).catch(error => {
    console.error('Impossible d’initialiser la base libSQL:', error);
    process.exitCode = 1;
});