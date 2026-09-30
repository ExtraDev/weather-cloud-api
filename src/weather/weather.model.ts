
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
    timestamp: number;
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