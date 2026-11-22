import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('server/storage/dharitri.sqlite');
const users = db.prepare('SELECT id, email, name, role FROM users').all();
console.log('Users in DB:');
users.forEach(u => console.log(`- ${u.id}: ${u.name} <${u.email}> (${u.role})`));
