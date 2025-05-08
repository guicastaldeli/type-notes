import { Database } from "sql.js";
import initSqlJs from "sql.js";

export async function setDB(): Promise<Database> {
    let SQL: any;

    if(!SQL) {
        SQL = await initSqlJs({
            locateFile: () => new URL('../../app/node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url).href
        });
    }

    let db: Database;
    const savedDb = localStorage.getItem('app-database');

    if(savedDb) {
        try {
            const binaryArray = new Uint8Array(JSON.parse(savedDb));
            db = new SQL.Database(binaryArray);
        } catch(e) {
            console.error('Failed to load database', e);
            db = new SQL.Database();
        }
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS settings(
            key TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS notes(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    return db;
}

export function getSettings(db: Database, key: string): string | null {
    try {
        const res = db.exec('SELECT value FROM settings WHERE key = ?', [key]);
        return res.length && res[0].values.length ? res[0].values[0][0] as string : null;
    } catch(e) {
        console.error(e);
        return null;
    }
}

export function setSettings(db: Database, key: string, value: string): void {
    try {
        const stringValue = typeof value === 'string' ? value : String(value);
        db.exec('INSERT OR REPLACE INTO settings (key, value) VALUES(?, ?)', [key, stringValue]);
        saveDB(db);
    } catch(e) {
        throw e;
    }
}

export function saveDB(db: Database): void {
    try {
        const binaryArray = db.export();
        localStorage.setItem('app-database', JSON.stringify({ data: Array.from(binaryArray) }));
    } catch(e) {
        console.error('Failed to save database', e);
    }
}

export async function initDB<T>(operation: (db: Database) => T): Promise<T> {
    const db = await setDB();

    try {
        const res = operation(db);
        console.log('Operation completed', res);
        return res;
    } catch(e) {
        throw e;
    } finally {
        console.log('Saving database...');
        saveDB(db);
    }
}