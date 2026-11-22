import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');
if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath, fs.constants.COPYFILE_EXCL);
  console.log('[setup] Created .env from .env.example. Add your own credentials locally; never commit .env.');
}
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  if (/^\s*VITE_API_MODE\s*=\s*false\s*$/m.test(envText)) {
    console.warn('[setup] VITE_API_MODE=false disables backend-backed uploads and DigiLocker. Set it to true for the full-stack app, then restart.');
  }
}
const isWin = process.platform === 'win32';
const command = isWin ? 'npm.cmd' : 'npm';
const api = spawn(command, ['run', 'server'], { stdio: 'inherit', env: process.env, shell: isWin });
const web = spawn(command, ['run', 'dev', '--', '--host', '127.0.0.1'], { stdio: 'inherit', env: process.env, shell: isWin });
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of [api, web]) if (child.exitCode === null) child.kill('SIGTERM');
  process.exitCode = code;
}
api.on('error', e => { console.error('[api] Could not start Node API:', e.message); stop(1); });
web.on('error', e => { console.error('[web] Could not start Vite:', e.message); stop(1); });
api.on('exit', code => { if (!stopping && code !== null && code !== 0) { console.error(`[api] Server exited with code ${code}`); stop(code); } });
web.on('exit', code => { if (!stopping && code !== null && code !== 0) { console.error(`[web] Vite exited with code ${code}`); stop(code); } });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
