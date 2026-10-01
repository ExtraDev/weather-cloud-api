import { db } from "../common/database/database";
import { DeviceValues } from "./weather.schema";

export class WeatherRepository {
    public async saveDeviceValues(deviceId: string, deviceValues: DeviceValues): Promise<boolean> {
        const toNumber = (value: string): number => {
            const number = Number(value);
            if (!Number.isFinite(number)) {
                throw new Error(`Valeur météo invalide : ${value}`);
            }
            return number;
        };

        const result = await db.execute({
            sql: `
            INSERT INTO device_infos (
                deviceId,
                timestamp,
                temp,
                hum,
                dew,
                wspdavg,
                wdiravg,
                bar,
                rain,
                rainrate,
                solarrad,
                uvi
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
                deviceId,
                Date.now(),
                toNumber(deviceValues.values.temp),
                toNumber(deviceValues.values.hum),
                toNumber(deviceValues.values.dew),
                toNumber(deviceValues.values.wspdavg),
                toNumber(deviceValues.values.wdiravg),
                toNumber(deviceValues.values.bar),
                toNumber(deviceValues.values.rain),
                toNumber(deviceValues.values.rainrate),
                toNumber(deviceValues.values.solarrad),
                toNumber(deviceValues.values.uvi),
            ],
        });

        return Number(result.rowsAffected) === 1;
    }
}