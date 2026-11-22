import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const ROOT = 'C:\\Users\\Dayakarthik S\\.gemini\\antigravity\\scratch\\dharitri-sentu-live';
const BRAIN_ZIP = 'C:\\Users\\Dayakarthik S\\.gemini\\antigravity\\brain\\a349c3bf-dcfd-4e7b-bb1b-7f7d51f61407\\dharitri-sentu-latest-complete.zip';
const USER_DOWNLOADS = path.join(os.homedir(), 'Downloads', 'dharitri-sentu-latest-complete.zip');
const USER_DESKTOP = path.join(os.homedir(), 'Desktop', 'dharitri-sentu-latest-complete.zip');

const stageDir = path.join(os.tmpdir(), `dharitri-stage-${Date.now()}`);
fs.mkdirSync(stageDir, { recursive: true });

console.log('Staging files...');
try {
  execSync(`robocopy "${ROOT}" "${stageDir}" /E /XD node_modules .git dist server/storage /XF *.sqlite *.sqlite-journal /NJH /NJS /NDL /NC /NS`, { stdio: 'ignore' });
} catch {
  // robocopy returns non-zero codes on successful copy
}

console.log('Compressing zip archive...');
const psZipCmd = `powershell -Command "Compress-Archive -Path '${stageDir}\\*' -DestinationPath '${BRAIN_ZIP}' -Force"`;
execSync(psZipCmd, { stdio: 'inherit' });

console.log('Copying to Downloads and Desktop...');
fs.copyFileSync(BRAIN_ZIP, USER_DOWNLOADS);
fs.copyFileSync(BRAIN_ZIP, USER_DESKTOP);

fs.rmSync(stageDir, { recursive: true, force: true });
console.log('Zip package updated successfully:');
console.log('1. Brain:', BRAIN_ZIP, `(${(fs.statSync(BRAIN_ZIP).size / 1024 / 1024).toFixed(2)} MB)`);
console.log('2. Downloads:', USER_DOWNLOADS);
console.log('3. Desktop:', USER_DESKTOP);
