import { chromium, type Browser } from 'playwright';
import { Cache } from '../common/helpers/cache.helper';
import { Evolution, Measure, WeatherCloudData } from './models/weather.model';
import { DeviceValues, DeviceValuesSchema } from './models/weather.schema';
import { WeatherRepository } from './weather.repository';

const variablesName = new Map<number, string>([
    [101, 'temperature'],
    [201, 'humidity'],
    [701, 'hPa'],
    [541, 'wind_speed'],
    [801, 'rain_'],
    [901, 'rain'],
]);

export class WeatherService {
    private weatherRepository = new WeatherRepository();
    private cache = new Cache();

    public async getEvolution(deviceId: string, variablesToFetch: Array<number>, requestedPeriod: string): Promise<Array<Evolution>> {
        const url = `https://app.weathercloud.net/d${deviceId}#evolution`;
        const evolutions = new Array<Evolution>();
        const key = `evolution-${deviceId}-${variablesToFetch.join("")}-${requestedPeriod}`;

        let browser: Browser | undefined;
        const cachedData = this.cache.get<Array<Evolution>>(key);
        if (cachedData) {
            console.log("Retreive from cache");
            return cachedData;
        }

        try {
            browser = await chromium.launch({
                headless: true,
            });
            const page = await browser.newPage();

            const requestPromise = page.waitForRequest(async request => {
                if (request.method() !== 'POST') return false;
                try {
                    const data = await (await request.response())?.json();
                    return data?.status === 'success' && !!data?.data?.summary;
                } catch {
                    return false;
                }
            });

            await page.goto(url, {
                waitUntil: 'domcontentloaded'
            });

            const templateRequest = await requestPromise;
            const templateParams = new URLSearchParams(templateRequest.postData() || '');
            const device = templateParams.get('device');
            const csrfToken = templateParams.get('WEATHERCLOUD_CSRF_TOKEN');

            if (device === null || csrfToken === null) {
                throw new Error("Impossible de récupérer les paramètres de la requête WeatherCloud.");
            }

            for (const variable of variablesToFetch) {
                const requestParams: Record<string, string> = {
                    device,
                    variable: variable.toString(),
                    period: requestedPeriod,
                    WEATHERCLOUD_CSRF_TOKEN: csrfToken
                };

                const body = new URLSearchParams(requestParams);

                const { status, text } = await page.evaluate(async ({ requestUrl, requestBody }) => {
                    const response = await fetch(requestUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: requestBody,
                        credentials: 'include',
                    });
                    return { status: response.status, text: await response.text() };
                }, { requestUrl: templateRequest.url(), requestBody: body.toString() });

                if (status !== 200) {
                    console.error(`Requête pour la variable ${variable} a échoué (status ${status}):`, text);
                    continue;
                }

                const { data } = JSON.parse(text) as { data: WeatherCloudData };
                const summary = data.summary[variable.toString()];
                const measures: Array<Measure> = Object.entries(data.values)
                    .flatMap(([timestamp, values]) => {
                        const stats = values[variable.toString()]?.stats;
                        if (!stats) return [];

                        const measure: Measure = {
                            min: stats.min,
                            max: stats.max,
                            total: stats?.total || null,
                            timestamp: +timestamp,
                        }

                        return [measure];
                    })
                    .sort((a, b) => a.timestamp - b.timestamp);

                const max = summary && summary.max != null && typeof summary.max === 'object'
                    ? (summary.max as { value: number | null }).value
                    : summary?.max || null;

                evolutions.push({
                    name: variablesName.get(variable) || 'unknown' || null,
                    min: summary?.min || null,
                    max: max,
                    total: summary?.total || null,
                    measures,
                });
            }

            this.cache.set(key, evolutions, 15);

        } catch (error) {
            console.error(`Impossible de récupérer les données depuis ${url}:`, error);
            throw new Error("Impossible de récupérer les données WeatherCloud.");
        } finally {
            await browser?.close();
        }

        return evolutions;
    }

    /**
     * Description: Get data and populate DB for register devices
     */
    public async getDeviceInfos(deviceId: string, saveInDb = false): Promise<DeviceValues> {
        const key = `infos-${deviceId}`;

        const cachedData = this.cache.get<DeviceValues>(key);
        if (cachedData) {
            console.log("Retreive from cache");
            return cachedData
        }

        const mapUrl = 'https://app.weathercloud.net/map';
        const requestUrl = `https://app.weathercloud.net/device/info/${deviceId}`;
        let res: DeviceValues;
        let browser: Browser | undefined;

        try {
            browser = await chromium.launch({
                headless: true,
            });

            const page = await browser.newPage();
            await page.goto(mapUrl, {
                waitUntil: 'domcontentloaded'
            });

            const { status, text } = await page.evaluate(async (url) => {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'include',
                });
                return { status: response.status, text: await response.text() };
            }, requestUrl);

            if (status !== 200) {
                throw new Error(`La requête WeatherCloud a échoué (status ${status}): ${text}`);
            }

            res = DeviceValuesSchema.parse(JSON.parse(text));
            this.cache.set<DeviceValues>(key, res, 5);

            if (saveInDb) {
                await this.weatherRepository.saveDeviceValues(deviceId, res);
            }
        } catch (error) {
            console.error(`Impossible de récupérer les informations du device ${deviceId}:`, error);
            throw new Error('Impossible de récupérer les informations WeatherCloud.');
        } finally {
            await browser?.close();
        }

        return res;
    }
}