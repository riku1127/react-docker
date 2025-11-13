// db.ts
import mysql from 'mysql2';

// まずは「非Promise」のプールを作る
const rawPool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'todo_app',
    charset: 'utf8mb4', // これは残す
    waitForConnections: true,
    connectionLimit: 10,
});

// ここが肝：プールが“新しい接続”を作るたびに実行
rawPool.on('connection', (conn) => {
    conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    conn.query("SET SESSION collation_connection = 'utf8mb4_unicode_ci'");
    conn.query("SET SESSION character_set_results = 'utf8mb4'");
});

// アプリ側は Promise Pool を使う
export const pool = rawPool.promise();
