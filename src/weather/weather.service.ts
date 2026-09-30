import { differenceInHours } from 'date-fns';
import { chromium, type Browser } from 'playwright';
import { Evolution, EvolutionStore, Measure, WeatherCloudData } from './weather.model';
import { WeatherRepository } from './weather.repository';
import { DeviceValues, DeviceValuesSchema } from './weather.schema';

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
    private browser: Browser | undefined;
    private evolutionsCache = new Map<string, EvolutionStore>(); // hash, time and data

    public async getEvolution(deviceId: string, variablesToFetch: Array<number>, requestedPeriod: string): Promise<Array<Evolution>> {
        const url = `https://app.weathercloud.net/d${deviceId}#evolution`;
        const evolutions = new Array<Evolution>();
        const key = `${deviceId}-${variablesToFetch.join("")}-${requestedPeriod}`;

        try {
            const cachedData = this.evolutionsCache.get(key);
            if (cachedData) {
                // check timing > 60 minutes
                if (differenceInHours(new Date(cachedData.timestamp), new Date()) > 1) {
                    return cachedData.evolutions;
                }
            }

            this.browser = await chromium.launch({
                headless: true,
            });
            const page = await this.browser.newPage();

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
                            timestamp: +timestamp,
                        }

                        return [measure];
                    })
                    .sort((a, b) => a.timestamp - b.timestamp);

                evolutions.push({
                    name: variablesName.get(variable) || 'unknown',
                    min: summary.min,
                    max: summary.max,
                    measures,
                });
            }
        } catch (error) {
            console.error(`Impossible de récupérer les données depuis ${url}:`, error);
            throw new Error("Impossible de récupérer les données WeatherCloud.");
        } finally {
            await this.browser?.close();
        }

        const evolutionsStore: EvolutionStore = {
            timestamp: Date.now(),
            evolutions
        }

        this.evolutionsCache.set(key, evolutionsStore);

        return evolutions;
    }

    /**
     * Description: Get data and populate DB for register devices
     */
    public async getDeviceInfos(deviceId: string): Promise<DeviceValues> {
        const mapUrl = 'https://app.weathercloud.net/map';
        const requestUrl = `https://app.weathercloud.net/device/info/${deviceId}`;
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

            const res = DeviceValuesSchema.parse(JSON.parse(text));

            this.weatherRepository.saveDeviceValues(deviceId, res);

            console.log(new Date(Date.now()), res);

            return res;
        } catch (error) {
            console.error(`Impossible de récupérer les informations du device ${deviceId}:`, error);
            throw new Error('Impossible de récupérer les informations WeatherCloud.');
        } finally {
            await browser?.close();
        }
    }
}