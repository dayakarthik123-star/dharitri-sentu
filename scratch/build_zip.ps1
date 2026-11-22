$src = "C:\Users\Dayakarthik S\OneDrive\Desktop\Dharitri-Sentu-Build\dharitri-rebuild"
$dest1 = "C:\Users\Dayakarthik S\OneDrive\Desktop\dharitri-sentu-latest-complete.zip"
$dest2 = "C:\Users\Dayakarthik S\.gemini\antigravity\brain\a349c3bf-dcfd-4e7b-bb1b-7f7d51f61407\dharitri-sentu-latest-complete.zip"

if (Test-Path $dest1) { Remove-Item -Force $dest1 }
if (Test-Path $dest2) { Remove-Item -Force $dest2 }

$tempStage = "$env:TEMP\dharitri_zip_stage"
if (Test-Path $tempStage) { Remove-Item -Recurse -Force $tempStage }
New-Item -ItemType Directory -Path $tempStage | Out-Null

# Copy everything except node_modules, dist, .git, storage, and temp files
Get-ChildItem -Path $src | Where-Object { $_.Name -notin @('node_modules', 'dist', '.git', 'tempCodeRunnerFile.exe', 'tempCodeRunnerFile.c') } | ForEach-Object {
    if ($_.Name -eq 'server') {
        Copy-Item -Path $_.FullName -Destination "$tempStage\server" -Recurse -Exclude @('storage', 'dharitri.sqlite*')
    } else {
        Copy-Item -Path $_.FullName -Destination $tempStage -Recurse
    }
}

Compress-Archive -Path "$tempStage\*" -DestinationPath $dest1 -Force
Copy-Item -Path $dest1 -Destination $dest2 -Force
Remove-Item -Recurse -Force $tempStage
Write-Host "Zip created successfully at $dest1 and $dest2"
