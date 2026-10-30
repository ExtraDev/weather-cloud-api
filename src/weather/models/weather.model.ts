
export interface Evolution {
    name: string | null;
    min: number | null;
    max: number | null;
    total: number | null;
    measures: Array<Measure>;
}

export interface Measure {
    min: number;
    max: number;
    total: number | null;
    timestamp: number;
}

export interface ValueStats {
    sum: number;
    min: number;
    min_time: number;
    max: number;
    max_time: number;
    total: number;
}

export interface ValueWithStats {
    stats: ValueStats;
}

export interface WeatherCloudData {
    summary: Record<string, Pick<ValueStats, 'min' | 'max' | 'total'>>;
    values: Record<string, Record<string, ValueWithStats>>;
}