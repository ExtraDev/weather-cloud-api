import { z } from 'zod';

export const DeviceSchema = z.object({
    account: z.number(),
    status: z.string(),
    city: z.string(),
    image: z.string().nullable(),
    isWebcam: z.boolean(),
    favorite: z.boolean(),
    social: z.boolean(),
    altitude: z.string(),
    update: z.number(),
});

export type Device = z.infer<typeof DeviceSchema>;

export const InfoValuesSchema = z.object({
    temp: z.string(),
    hum: z.string(),
    dew: z.string(),
    wspdavg: z.string(),
    wdiravg: z.string(),
    bar: z.string(),
    rain: z.string(),
    rainrate: z.string(),
    solarrad: z.string(),
    uvi: z.string(),
});

export type InfoValues = z.infer<typeof InfoValuesSchema>;

export const DeviceValuesSchema = z.object({
    device: DeviceSchema,
    values: InfoValuesSchema,
});

export type DeviceValues = z.infer<typeof DeviceValuesSchema>;