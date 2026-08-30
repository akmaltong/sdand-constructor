type SqliteBinding = string | number | bigint | boolean | null | Uint8Array;
export interface SqliteRunResult {
    changes: number;
    lastInsertRowid: number | bigint;
}
export interface SqliteStatement {
    all(...params: SqliteBinding[]): unknown[];
    get(...params: SqliteBinding[]): unknown;
    run(...params: SqliteBinding[]): SqliteRunResult;
}
export interface SqliteDatabase {
    exec(sql: string): void;
    query(sql: string): SqliteStatement;
    close(): void;
}
export declare function openSqliteDatabase(filename: string): Promise<SqliteDatabase>;
export {};
//# sourceMappingURL=sqlite-driver.d.ts.map