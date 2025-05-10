import initSqlJs, { Database, SqlJsStatic } from "sql.js";

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;

export async function setDB(): Promise<Database> {
    if(!SQL) {
        SQL = await initSqlJs({
            locateFile: () => new URL('../../app/node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url).href
        });
    }

    if(!dbInstance) {
        const savedDb = localStorage.getItem('app-database');
    
        if(savedDb) {
            try {
                const parsed = JSON.parse(savedDb);
                const binaryArray = new Uint8Array(parsed.data);
                dbInstance = new SQL.Database(binaryArray);
            } catch(e) {
                console.error('Failed to load database', e);
                dbInstance = new SQL.Database();
            }
        } else {
            dbInstance = new SQL.Database();
        }
    }

    dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS notes(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT DEFAULT 'default',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings(
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);

    return dbInstance;
}

export function saveDB(db: Database): void {
    if(!dbInstance) return;

    try {
        const binaryArray = db.export();
        localStorage.setItem('app-database', JSON.stringify({ data: Array.from(binaryArray) }));
    } catch(e) {
        console.error('Failed to save database', e);
    }
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

export async function initDB<T>(operation: (db: Database) => T): Promise<T> {
    const db = await setDB();

    try {
        const res = await operation(db);
        saveDB(db);
        return res;
    } catch(e) {
        throw e;
    }
}

//Notes
    export async function getNotes(status: string): Promise<any[]> {
        return initDB(db => {
            const stmt = db.prepare('SELECT * FROM notes WHERE status = ?');
            stmt.bind([status]);
            const notes = [];
            while(stmt.step()) {
                const note = stmt.getAsObject();
                note.createdAt = convertDate(note.created_at?.toString());
                note.updatedAt = convertDate(note.updated_at?.toString());
                notes.push(note);
            };
            stmt.free();
            return notes;
        });
    }

    //Convert Date
    function convertDate(date: string | undefined): string {
        if(!date) return new Date().toISOString();
        if(date.includes('T')) return date;
        return date.replace(' ', 'T') + 'Z';
    }

    export async function _addNote(title: string, content: string, status: string): Promise<number> {
        return initDB(db => {
            const now = new Date().toISOString();
            db.run("INSERT INTO notes(title, content, status, created_at) VALUES(?, ?, ?, ?)", [title, content, status, now]);
            return db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
        });
    }

    export async function _updateNoteStatus(id: number, status: string): Promise<void> {
        return initDB(db => {
            const now = new Date().toISOString();
            db.run("UPDATE notes SET status = ?, updated_at = ? WHERE id = ?", [status, now, id]);
        });
    }

    export async function _deleteNote(id: number): Promise<void> {
        return initDB(db => {
            db.run("DELETE FROM notes WHERE id = ?", [id]);
        })
    }
//