import { Router } from "express";
import { WeatherController } from "./weather.controller";

const weatherController = new WeatherController();

export default (router: Router) => {
    router.get("/weather/evolution", weatherController.getEvolution);
}