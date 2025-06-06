import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import { svgData } from "./img-content";
import { NoteStatus } from "./note-component";

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

                const colums = dbInstance.exec('PRAGMA table_info(notes)');
                const hasFavoriteColumn = colums[0].values.some((col: any) => col[1] === 'is_favorite');
                const hasPreviousStatusColumn = colums[0].values.some((col: any) => col[1] === 'previous_status');

                if(!hasFavoriteColumn) dbInstance.exec('ALTER TABLE notes ADD COLUMN is_favorite INTEGER DEFAULT 0');
                if(!hasPreviousStatusColumn) dbInstance.exec('ALTER TABLE notes ADD COLUMN previous_status TEXT DEFAULT "default"');
                if(!hasFavoriteColumn || !hasPreviousStatusColumn) saveDB(dbInstance);
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
            content TEXT NOT NULL,
            status TEXT DEFAULT 'default',
            previous_status TEXT DEFAULT 'default',
            is_favorite INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings(
            key TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS text_options(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            value TEXT NOT NULL,
            label TEXT,
            style TEXT,
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS assets(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_text_options_type ON text_options(type);
    `);

    await initAssets(dbInstance);
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
            const stmt = db.prepare('SELECT * FROM notes WHERE status = ? ORDER BY is_favorite DESC, created_at DESC');
            stmt.bind([status]);
            const notes = [];
            while(stmt.step()) {
                const note = stmt.getAsObject();

                note.isFavorite = note.is_favorite;
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

    export async function _addNote(content: string, status: string): Promise<number> {
        return initDB(db => {
            const now = new Date().toISOString();
            db.run("INSERT INTO notes(content, status, created_at) VALUES(?, ?, ?)", [content, status, now]);
            return db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
        });
    }

    export async function _updateNoteStatus(id: number, status: string): Promise<void> {
        return initDB(db => {
            const now = new Date().toISOString();

            db.run(`
                UPDATE notes 
                SET previous_status = status,
                    status = ?,
                    updated_at = ? 
                WHERE id = ?`, 
                [status, now, id]
            );
        });
    }

    export async function getNotePreviousStatus(id: number): Promise<NoteStatus> {
        return initDB(db => {
            const stmt = db.prepare('SELECT previous_status FROM notes WHERE id = ?');
            stmt.bind([id]);

            if(stmt.step()) {
                const row = stmt.getAsObject();
                const status = row.previous_status as string;
                return status === 'archived' ||
                       status === 'deleted' ?
                       status : 'default';
            }

            stmt.free();
            return 'default';
        });
    }

    export async function _updateNote(id: number, content: string): Promise<void> {
        return initDB(db => {
            const now = new Date().toISOString();

            db.run("UPDATE notes SET content = ?, updated_at = ? WHERE id = ?", [content, now, id]);
        });
    }

    export async function _deleteNote(id: number): Promise<void> {
        return initDB(db => {
            db.run("DELETE FROM notes WHERE id = ?", [id]);
        })
    }
//

//Options
    interface TextOption {
        id?: number;
        type: string;
        name: string;
        value: string;
        label?: string;
        title?: string;
        command?: string;
        style?: Record<string, string | undefined> | string;
        sort_order?: number;
    }

    export async function getTextOptions(type: string): Promise<any[]> {
        return initDB(db => {
            const stmt = db.prepare('SELECT * FROM text_options WHERE type = ? ORDER BY sort_order ASC');
            stmt.bind([type]);
            const options: TextOption[] = [];

            while(stmt.step()) {
                const option = stmt.getAsObject() as unknown as TextOption;
                
                if(option.style && typeof option.style === 'string') {
                    try {
                        let parsed = JSON.parse(option.style);

                        while(typeof parsed === 'string') {
                            parsed = JSON.parse(parsed);
                        }

                        option.style = parsed;
                    } catch {
                        option.style = {}
                    }
                }

                options.push(option);
            }

            stmt.free();
            return options;
        });
    }

    export async function addTextOptions(option: { 
        type: string; 
        name: string; 
        value: string; 
        label?: string; 
        style?: Record<string, string | undefined> | string; 
        sort_order?: number 
    }): Promise<void> {
        return initDB(db => {
            const styleSave = option.style && typeof option.style === 'object'
                ? Object.fromEntries(
                    Object.entries(option.style).filter(([_, value]) => value !== undefined)
                )
                : option.style
            ;

            const styleString = option.style ?
                typeof styleSave === 'string'
                    ? styleSave
                    : JSON.stringify(styleSave)
                : ''
            ;

            db.run(`
                INSERT INTO text_options (
                    type, 
                    name, 
                    value, 
                    label, 
                    style, 
                    sort_order
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                option.type, 
                option.name, 
                option.value, 
                option.label || option.name, 
                styleString, 
                option.sort_order || 0
            ]);
        });
    }

    //Options
        //Size
        async function _setSizeOptions(db: Database): Promise<void> {
            const sizeOptions = await getTextOptions('size');
            if(sizeOptions.length > 0) return;

            if(sizeOptions.length === 0) {
                const sizes = Array.from({ length: 56 }, (_, i) => i + 1)
                    .filter(size => size % 7 === 0)
                    .map((size, i) => ({
                        type: 'size',
                        name: `${size}px`,
                        value: size.toString(),
                        label: `${size}px`,
                        sort_order: i
                    }
                ));

                for(const size of sizes) await addTextOptions(size);
            }
        }

        //Format
        async function _setFormatOptions(db: Database): Promise<void> {
            const formatOptions = await getTextOptions('format');

            if(formatOptions.length === 0) {
                const formats = [
                    {
                        type: 'format',
                        name: 'bold',
                        value: 'bold',
                        title: 'Bold',
                        command: 'bold',
                        label: 'B',
                        style: { fontWeight: 'bold' },
                        sort_order: 0
                    },
                    {
                        type: 'format',
                        name: 'italic',
                        value: 'italic',
                        title: 'Italic',
                        command: 'italic',
                        label: 'I',
                        style: { fontStyle: 'italic' },
                        sort_order: 1
                    },
                    {
                        type: 'format',
                        name: 'underline',
                        value: 'underline',
                        title: 'Underline',
                        command: 'underline',
                        label: 'U',
                        style: { textDecoration: 'underline' },
                        sort_order: 2
                    }
                ];

                for(const format of formats) {
                    await addTextOptions({
                        ...format,
                        style: JSON.stringify(format.style)
                    });
                }
            }
        }

        //Color
        async function _setColorOptions(db: Database): Promise<void> {
            const colorOptions = await getTextOptions('color');

            if(colorOptions.length === 0) {
                const colors = [
                    { type: 'color', name: 'Black', value: 'rgb(0, 0, 0)', sort_order: 0 },
                    { type: 'color', name: 'Red', value: 'rgb(179, 23, 23)',  sort_order: 1 },
                    { type: 'color', name: 'Green', value: 'rgb(36, 148, 26)',  sort_order: 2 },
                    { type: 'color', name: 'Blue', value: 'rgb(26, 74, 197)',  sort_order: 3 },
                    { type: 'color', name: 'Yellow', value: 'rgb(241, 187, 9)',  sort_order: 4 },
                ];

                for(const color of colors) await addTextOptions(color);
            }
        }
    //

    export async function initTextOptions(): Promise<void> {
        return initDB(async db => {
            await Promise.all([
                _setSizeOptions(db),
                _setFormatOptions(db),
                _setColorOptions(db)
            ]);
        });
    }
//

//Favorite Note
export async function toggleFavoriteNote(id: number): Promise<void> {
    return initDB(db => {
        try {
            const now = new Date().toISOString();

            db.run('UPDATE notes SET is_favorite = NOT is_favorite, updated_at = ? WHERE id = ?',
            [now, id]);
        } catch(e) {
            console.error(e);
            throw e;
        }
    });
}

export async function getFavoriteNotes(): Promise<any[]> {
    return initDB(db => {
        const stmt = db.prepare('SELECT * FROM notes WHERE is_favorite = 1 AND status = "default" ORDER BY created_at DESC');
        const notes = [];
        while(stmt.step()) {
            const note = stmt.getAsObject();
            note.createdAt = convertDate(note.created_at?.toString());
            note.updatedAt = convertDate(note.updated_at?.toString());
            notes.push(note);
        }

        stmt.free();
        return notes;
    })
}

//Search Notes
export async function searchNotes(searchTerm: string, status?: string): Promise<any[]> {
    try {
        const db = await setDB();
        if(!db) throw new Error('Databse error');
        
        const term = `%${searchTerm}%`;
    
        const query = status
            ? `SELECT * FROM notes 
                WHERE (content LIKE ? COLLATE NOCASE) 
                AND status = ?
                ORDER BY created_at DESC`
            : `SELECT * FROM notes 
                WHERE content LIKE ? COLLATE NOCASE
                ORDER BY created_at DESC`
            ;
        ;
    
        const params = status ? [term, status] : [term];
        const stmt = db.prepare(query);
        stmt.bind(params);
    
        const notes = [];
    
        while(stmt.step()) {
            const note = stmt.getAsObject();
            note.createdAt = convertDate(note.created_at?.toString());
            note.updatedAt = convertDate(note.updated_at?.toString());
    
            notes.push(note);
        }
    
        stmt.free();
        return notes;
    } catch(e) {
        console.log(e);
        return [];
    }
}

//Assets
export async function storeAsset(db: Database, name: string, type: string, content: string): Promise<void> {
    db.run(
        'INSERT OR REPLACE INTO assets(name, type, content) VALUES(?, ?, ?)',
        [name, type, content]
    );
    saveDB(db);
} 

export async function getAsset(name: string): Promise<{ type: string; content: string } | null> {
    return initDB(db => {
        try {
            const stmt = db.prepare('SELECT type, content FROM assets WHERE name = ? COLLATE NOCASE');
            stmt.bind([name.trim()]);
    
            if(stmt.step()) {
                const row = stmt.getAsObject();
                const asset = {
                    type: String(row.type),
                    content: String(row.content),
                }

                stmt.free();
                return asset;
            }
    
            stmt.free();
            return null;
        } catch(e) {
            console.error(e);
            return null;
        }
    })
}

export async function getAllAssets(): Promise<Array<{ name: string, type: string, content: string }>> {
    return initDB(db => {
        const stmt = db.prepare('SELECT name, type, content FROM assets');
        const assets: Array<{ name: string, type: string, content: string }> = [];
        
        while(stmt.step()) {
            const row = stmt.getAsObject();
            assets.push({
                name: String(row.name),
                type: String(row.type),
                content: String(row.content)
            });

        }
        
        stmt.free();
        return assets;
    });
}

export async function initAssets(db: Database): Promise<void> {
    try {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM assets');

        if(stmt.step()) {
            const row = stmt.getAsObject();
            if(Number(row.count) > 0) {
                stmt.free();
                return;
            }
        }

        stmt.free();

        const assets = [
            { name: 'logo', path: new URL('./assets/img/logo.png', import.meta.url).href, type: 'image' },
            { name: 'search-icon', path: new URL('./assets/img/search-icon.png', import.meta.url).href, type: 'image' },

            { name: 'fav-notes-icon', path: new URL('./assets/img/fav-notes-icon-img.png', import.meta.url).href, type: 'image' },
            { name: 'active-settings-icon', path: new URL('./assets/img/settings-icon-img-active.png', import.meta.url).href, type: 'image' },
            { name: 'settings-icon', path: new URL('./assets/img/settings-icon-img.png', import.meta.url).href, type: 'image' },
            { name: 'back-icon', path: new URL('./assets/img/back-icon-img.png', import.meta.url).href, type: 'image' },

            //Home
            { name: 'active-home-icon', path: new URL('./assets/img/active-home-icon.png', import.meta.url).href, type: 'image' },
            { name: 'home-icon', path: new URL('./assets/img/home-icon.png', import.meta.url).href, type: 'image' },

            //Archive
            { name: 'active-archive-icon', path: new URL('./assets/img/active-archive-icon.png', import.meta.url).href, type: 'image' },
            { name: 'archive-icon', path: new URL('./assets/img/archive-icon.png', import.meta.url).href, type: 'image' },

            //Deleted
            { name: 'active-deleted-icon', path: new URL('./assets/img/active-deleted-icon.png', import.meta.url).href, type: 'image' },
            { name: 'deleted-icon', path: new URL('./assets/img/deleted-icon.png', import.meta.url).href, type: 'image' }
        ];
        
        for(const asset of assets) {
            try {
                let content: string;

                if(asset.type === 'svg') {
                    content = await svgData(asset.path);
                } else {
                    const res = await fetch(asset.path);
                    const blob = await res.blob();
                    content = await new Promise<string>((res) => {
                        const reader = new FileReader();
                        reader.onload = () => res(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                } 
                
                await storeAsset(db, asset.name, asset.type, content);
            } catch(e) {
                console.error(`Failed to load asset ${asset.name}: `, e);
            }
        }
    } catch(e) {
        console.error(e)
    }
}

//LOG ~~~~if needed
    async function __checkLog() {
        const db = await setDB();
        const res = db.exec('SELECT COUNT(*) as count FROM notes');
        const count = res[0].values[0][0];
        console.log(count);
    }

    //__checkLog();
//