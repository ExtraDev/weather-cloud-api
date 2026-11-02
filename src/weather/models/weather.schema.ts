import { z } from 'zod';

export const DeviceSchema = z.object({
    account: z.number(),
    status: z.string(),
    city: z.string(),
    image: z.string().nullable(),
    isWebcam: z.boolean(),
    favorite: z.boolean(),
    social: z.union([z.boolean(), z.string()]),
    altitude: z.string(),
    update: z.number(),
});
export type Device = z.infer<typeof DeviceSchema>;

const weatherValueSchema = z.string().transform(value => value === '-3276.8' || value === '-32768' ? null : value);

export const InfoValuesSchema = z.object({
    temp: weatherValueSchema.optional(),
    hum: weatherValueSchema.optional(),
    dew: weatherValueSchema.optional(),
    wspdavg: weatherValueSchema.optional(),
    wdiravg: weatherValueSchema.optional(),
    bar: weatherValueSchema.optional(),
    rain: weatherValueSchema.optional(),
    rainrate: weatherValueSchema.optional(),
    solarrad: weatherValueSchema.optional(),
    uvi: weatherValueSchema.optional(),
});
export type InfoValues = z.infer<typeof InfoValuesSchema>;

export const DeviceValuesSchema = z.object({
    device: DeviceSchema,
    values: InfoValuesSchema,
});
export type DeviceValues = z.infer<typeof DeviceValuesSchema>;