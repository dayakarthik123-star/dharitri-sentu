import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const src = 'C:\\Users\\Dayakarthik S\\.gemini\\antigravity\\scratch\\dharitri-sentu-live';
const dest = 'C:\\Users\\Dayakarthik S\\.gemini\\antigravity\\brain\\a349c3bf-dcfd-4e7b-bb1b-7f7d51f61407\\dharitri-sentu-latest-complete.zip';

execSync(`powershell -ExecutionPolicy Bypass -Command "$src = '${src}'; $dest = '${dest}'; $temp = Join-Path $env:TEMP 'dharitri_zip_update'; if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }; New-Item -ItemType Directory -Path $temp | Out-Null; Get-ChildItem -Path $src | Where-Object { $_.Name -notin @('node_modules', 'dist', '.git', 'storage') } | ForEach-Object { Copy-Item -Path $_.FullName -Destination $temp -Recurse }; Compress-Archive -Path (Join-Path $temp '*') -DestinationPath $dest -Force; Remove-Item -Recurse -Force $temp; Write-Host 'Done';"`, { stdio: 'inherit' });
console.log('Archive updated successfully');
