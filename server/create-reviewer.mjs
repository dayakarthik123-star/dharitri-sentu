import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.env.DATA_DIR || './server/storage');
const dbPath = path.resolve(process.env.DB_PATH || path.join(dataDir, 'dharitri.sqlite'));
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
const rl = readline.createInterface({ input, output });
const ask = (q) => rl.question(q);
const email = (await ask('Reviewer email: ')).trim().toLowerCase();
const name = (await ask('Reviewer display name: ')).trim();
const district = (await ask('Assigned jurisdiction (e.g. Kamrup Metropolitan): ')).trim() || 'Unassigned';
rl.close();

async function askHidden(prompt) {
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('A secure interactive terminal is required for a reviewer password. Re-run from Terminal; the password will not be accepted as a command-line argument.');
  }
  output.write(prompt);
  input.setRawMode(true);
  input.resume();
  let password = '';
  try {
    password = await new Promise((resolve, reject) => {
      const onData = (chunk) => {
        for (const byte of chunk) {
          if (byte === 3) { input.off('data', onData); reject(new Error('Cancelled.')); return; }
          if (byte === 13 || byte === 10) { input.off('data', onData); resolve(password); return; }
          if (byte === 127 || byte === 8) { password = password.slice(0, -1); continue; }
          if (byte >= 32 && byte <= 126 && password.length < 200) password += String.fromCharCode(byte);
        }
      };
      input.on('data', onData);
    });
  } finally {
    input.setRawMode(false);
    output.write('\n');
  }
  return password;
}

const password = await askHidden('Temporary password (min 12 characters; input hidden): ');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2 || password.length < 12) {
  console.error('Invalid email/name or password shorter than 12 characters.');
  process.exit(1);
}
const scrypt = promisify(crypto.scrypt);
const salt = crypto.randomBytes(16).toString('hex');
const hash = Buffer.from(await scrypt(password, salt, 64)).toString('hex');
const db = new DatabaseSync(dbPath);
try {
  db.prepare('INSERT INTO users(id,email,name,role,district,password_hash,password_salt,created_at,is_demo) VALUES(?,?,?,?,?,?,?,?,0)')
    .run(`usr-${crypto.randomUUID()}`, email, name, 'reviewer', district, hash, salt, new Date().toISOString());
  console.log(`Reviewer account created for ${email}. Password input was hidden; store the password in your password manager.`);
} catch (error) {
  console.error('Reviewer account could not be created. Check that the API has been started once to initialise the database and that the email is not already registered.');
  process.exitCode = 1;
} finally {
  db.close();
}
