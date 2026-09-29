export interface EvolutionStore {
    timestamp: number;
    evolutions: Array<Evolution>;
}

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

export interface ValueStats {
    sum: number;
    min: number;
    min_time: number;
    max: number;
    max_time: number;
}

export interface ValueWithStats {
    stats: ValueStats;
}

export interface WeatherCloudData {
    summary: Record<string, Pick<ValueStats, 'min' | 'max'>>;
    values: Record<string, Record<string, ValueWithStats>>;
}

export interface Device {
    account: number;
    status: string;
    city: string;
    image: string | null;
    isWebcam: boolean;
    favorite: boolean;
    social: boolean;
    altitude: string;
    update: number;
}

export interface InfoValues {
    temp: string;
    hum: string;
    dew: string;
    wspdavg: string;
    wdiravg: string;
    bar: string;
    rain: string;
    rainrate: string;
    solarrad: string;
    uvi: string;
}

export interface DeviceValues {
    device: Device;
    values: InfoValues;
}