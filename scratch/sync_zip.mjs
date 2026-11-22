import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const src = 'C:\\Users\\Dayakarthik S\\.gemini\\antigravity\\scratch\\dharitri-sentu-live';
const dest = 'C:\\Users\\Dayakarthik S\\.gemini\\antigravity\\brain\\a349c3bf-dcfd-4e7b-bb1b-7f7d51f61407\\dharitri-sentu-latest-complete.zip';
const temp = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'dharitri_zip_scratch');

try {
  if (fs.existsSync(temp)) fs.rmSync(temp, { recursive: true, force: true });
  fs.mkdirSync(temp, { recursive: true });

  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    if (['node_modules', 'dist', '.git', 'storage', 'scratch'].includes(entry)) continue;
    const fullSrc = path.join(src, entry);
    const fullDest = path.join(temp, entry);
    fs.cpSync(fullSrc, fullDest, { recursive: true });
  }

  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${temp}\\*' -DestinationPath \\"${dest}\\" -Force"`, { stdio: 'inherit' });
  fs.rmSync(temp, { recursive: true, force: true });
  console.log('Successfully refreshed dharitri-sentu-latest-complete.zip');
} catch (err) {
  console.error('Error refreshing zip:', err);
}
