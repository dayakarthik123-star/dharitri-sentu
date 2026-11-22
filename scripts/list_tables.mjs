import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('server/storage/dharitri.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in SQLite:', tables.map(t => t.name));
