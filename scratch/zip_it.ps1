$ProgressPreference = 'SilentlyContinue'
$src = 'C:\Users\Dayakarthik S\.gemini\antigravity\scratch\dharitri-sentu-live'
$dest = 'C:\Users\Dayakarthik S\.gemini\antigravity\brain\a349c3bf-dcfd-4e7b-bb1b-7f7d51f61407\dharitri-sentu-production-v3.zip'
$temp = 'C:\Users\Dayakarthik S\AppData\Local\Temp\dharitri_zip_v3'
if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
New-Item -ItemType Directory -Path $temp | Out-Null
Get-ChildItem -Path $src | Where-Object { $_.Name -notin @('node_modules', 'dist', '.git', 'storage', 'scratch') } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $temp -Recurse
}
Compress-Archive -Path (Join-Path $temp '*') -DestinationPath $dest -Force
Remove-Item -Recurse -Force $temp
Get-Item $dest | Select-Object Name, Length, LastWriteTime
