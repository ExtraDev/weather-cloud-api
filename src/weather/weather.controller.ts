import { CronJob } from "cron";
import { Request, Response } from "express";
import { WeatherService } from "./weather.service";

export class WeatherController {
    private weatherService = new WeatherService();

    public constructor() {
        this.weatherService.getDeviceInfos('1635490010').catch(error => {
            console.error('Échec de la récupération initiale des données météo:', error);
        });

        CronJob.from({
            cronTime: '10 */5 * * * *',// toutes les 5 minutes et 10 secondes
            onTick: async () => {
                try {
                    await this.weatherService.getDeviceInfos('1635490010');
                } catch (error) {
                    console.error('Échec de la tâche cron météo:', error);
                }
            },
            start: true,
            timeZone: 'Europe/Zurich',
        });
    }

    public getEvolution = async (req: Request, res: Response): Promise<void> => {
        const device = req.query.device;
        const variablesParam = req.query.variables;
        const requestedPeriod = req.query.period;

        if (typeof device !== 'string' || typeof variablesParam !== 'string' || typeof requestedPeriod !== 'string') {
            res.status(400).json({ error: 'Les paramètres variables et period sont requis.' });
            return;
        }

        const variablesToFetch = variablesParam.split(',').map(variable => +variable.trim()).filter(Boolean);
        if (variablesToFetch.length === 0) {
            res.status(400).json({ error: 'Le paramètre variables doit contenir au moins une variable.' });
            return;
        }

        try {
            const evolutions = await this.weatherService.getEvolution(device, variablesToFetch, requestedPeriod);
            res.status(200).json(evolutions);
        } catch (error) {
            console.error(error);
            res.status(502).json(error);
        }

        return;
    };

    public getDeviceInfos = async (req: Request, res: Response): Promise<void> => {
        try {
            const infos = await this.weatherService.getDeviceInfos('1635490010');
            res.status(200).json(infos);
        } catch (error) {
            console.error(error);
            res.status(502).json({ error: 'Impossible de récupérer les informations WeatherCloud.' });
        }
    }
}