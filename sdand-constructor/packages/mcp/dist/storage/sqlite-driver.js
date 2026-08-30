export async function openSqliteDatabase(filename) {
    if ('Bun' in globalThis) {
        const mod = (await import('bun:sqlite'));
        return new mod.Database(filename, { create: true, readwrite: true });
    }
    try {
        const mod = (await import('node:sqlite'));
        return adaptNodeDatabase(new mod.DatabaseSync(filename));
    }
    catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`SQLite requires Bun or a Node runtime with node:sqlite support. Failed to open ${filename}: ${reason}`);
    }
}
function adaptNodeDatabase(db) {
    return {
        exec(sql) {
            db.exec(sql);
        },
        query(sql) {
            const stmt = db.prepare(sql);
            return {
                all: (...params) => stmt.all(...params),
                get: (...params) => stmt.get(...params),
                run: (...params) => stmt.run(...params),
            };
        },
        close() {
            db.close();
        },
    };
}
