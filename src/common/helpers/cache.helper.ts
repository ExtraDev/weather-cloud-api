interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

export class Cache {
    private readonly cache = new Map<string, CacheEntry<unknown>>();

    public set<T>(key: string, data: T, durationInMinutes: number): void {
        const expiresAt = Date.now() + durationInMinutes * 60_000;

        this.cache.set(key, {
            data,
            expiresAt
        });
    }

    public get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);

        if (!entry) {
            return undefined;
        }

        if (Date.now() >= entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.data as T;
    }

    public delete(key: string): boolean {
        return this.cache.delete(key);
    }

    public clear(): void {
        this.cache.clear();
    }
}