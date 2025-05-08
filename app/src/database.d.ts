declare module 'sql.js' {
    interface Database {
        run(sql: string, params?: any[]): void;
        exec(sql: string, params?: any[]): any;
        export(): Uint8Array;
    }
}

declare module 'database' {
    import { Database } from "sql.js";

    export function setDB(): Promise<Database>;
    export function getSettings(db: Database, key: string): string | null;
    export function setSettings(db: Database, key: string, value: string): string;
    export function saveDB(db: Database): void;
    export function initDB<T>(operation: (db: Database) => T): Promise<T>;
}