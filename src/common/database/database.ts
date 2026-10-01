import { createClient } from '@libsql/client';
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL || 'file:app.db';
const databaseUrl = new URL(url);
const hasBasicAuth = Boolean(databaseUrl.username || databaseUrl.password);

let fetchWithBasicAuth: ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) | undefined;
let authToken = process.env.TURSO_AUTH_TOKEN;

if (hasBasicAuth) {
    const credentials = `${decodeURIComponent(databaseUrl.username)}:${decodeURIComponent(databaseUrl.password)}`;
    const authorization = `Basic ${Buffer.from(credentials).toString('base64')}`;
    databaseUrl.username = '';
    databaseUrl.password = '';

    fetchWithBasicAuth = (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set('Authorization', authorization);
        return fetch(input, { ...init, headers });
    };
    authToken = undefined;
}

export const db = createClient({
    url: hasBasicAuth ? databaseUrl.toString() : url,
    authToken,
    fetch: fetchWithBasicAuth,
});