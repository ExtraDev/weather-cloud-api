import { db } from "../common/database/database";
import { DeviceValues } from "./weather.schema";

export class WeatherRepository {
    public saveDeviceValues(deviceId: string, deviceValues: DeviceValues): boolean {
        const toNumber = (value: string): number => {
            const number = Number(value);
            if (!Number.isFinite(number)) {
                throw new Error(`Valeur météo invalide : ${value}`);
            }
            return number;
        };

        const result = db.prepare(`
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
            ) VALUES (
                @deviceId,
                @timestamp,
                @temp,
                @hum,
                @dew,
                @wspdavg,
                @wdiravg,
                @bar,
                @rain,
                @rainrate,
                @solarrad,
                @uvi
            )
        `).run({
            deviceId,
            timestamp: Date.now(),
            temp: toNumber(deviceValues.values.temp),
            hum: toNumber(deviceValues.values.hum),
            dew: toNumber(deviceValues.values.dew),
            wspdavg: toNumber(deviceValues.values.wspdavg),
            wdiravg: toNumber(deviceValues.values.wdiravg),
            bar: toNumber(deviceValues.values.bar),
            rain: toNumber(deviceValues.values.rain),
            rainrate: toNumber(deviceValues.values.rainrate),
            solarrad: toNumber(deviceValues.values.solarrad),
            uvi: toNumber(deviceValues.values.uvi),
        });

        return result.changes === 1;
    }
}