import { chromium, type Browser } from 'playwright';

export interface Evolution {
    name: string;
    min: number;
    max: number;
    measures: Array<Measure>;
}

export interface Measure {
    min: number;
    max: number;
    date: Date;
}

interface ValueStats {
    sum: number;
    min: number;
    min_time: number;
    max: number;
    max_time: number;
}

interface ValueWithStats {
    stats: ValueStats;
}

interface WeatherCloudData {
    summary: Record<string, Pick<ValueStats, 'min' | 'max'>>;
    values: Record<string, Record<string, ValueWithStats>>;
}

const variablesName = new Map<number, string>([
    [101, 'temperature'],
    [201, 'humidity'],
    [701, 'hPa'],
    [541, 'wind_speed'],
    [801, 'rain_'],
    [901, 'rain'],
]);


export class WeatherService {
    public async getEvolution(deviceId: string, variablesToFetch: Array<number>, requestedPeriod: string) {
        const url = 'https://app.weathercloud.net/d1635490010#evolution';
        const evolutions = new Array<Evolution>();
        let browser: Browser | undefined;

        try {
            browser = await chromium.launch({
                channel: 'chrome',
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

                        return [{
                            min: stats.min,
                            max: stats.max,
                            date: new Date(Number(timestamp) * 1000),
                        }];
                    })
                    .sort((a, b) => a.date.getTime() - b.date.getTime());

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
            await browser?.close();
        }

        return evolutions;
    }

    public async getDeviceInfos() {
    }
}