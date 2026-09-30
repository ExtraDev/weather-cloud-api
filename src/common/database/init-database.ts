import { db } from "./database";

export function initDatabase(): void {
    console.log('--- INIT DATABASE ---');

    db.exec(`
        CREATE TABLE IF NOT EXISTS device_infos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deviceId TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            temp REAL NOT NULL,
            hum REAL NOT NULL,
            dew REAL NOT NULL,
            wspdavg REAL NOT NULL,
            wdiravg REAL NOT NULL,
            bar REAL NOT NULL,
            rain REAL NOT NULL,
            rainrate REAL NOT NULL,
            solarrad REAL NOT NULL,
            uvi REAL NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_device_infos_device_timestamp
            ON device_infos (deviceId, timestamp);
    `);

    console.log('Database initialized');
}