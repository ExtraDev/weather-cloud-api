import { Request, Response } from "express";
import { WeatherService } from "./weather.service";

export class WeatherController {
    private weatherService = new WeatherService();

    public getEvolution = async (req: Request, res: Response): Promise<void> => {
        const variablesParam = req.query.variables;
        const requestedPeriod = req.query.period;

        if (typeof variablesParam !== 'string' || typeof requestedPeriod !== 'string') {
            res.status(400).json({ error: 'Les paramètres variables et period sont requis.' });
            return;
        }

        const variablesToFetch = variablesParam.split(',').map(variable => +variable.trim()).filter(Boolean);
        if (variablesToFetch.length === 0) {
            res.status(400).json({ error: 'Le paramètre variables doit contenir au moins une variable.' });
            return;
        }

        try {
            const evolutions = await this.weatherService.getEvolution('d1635490010', variablesToFetch, requestedPeriod);
            res.status(200).json(evolutions);
        } catch (error) {
            console.error(error);
            res.status(502).json(error);
        }

        return;
    };
}