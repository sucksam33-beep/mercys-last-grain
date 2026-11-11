$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$game=Join-Path $root 'game'
$staged=Join-Path $root 'dialogue-opening-stage/game'
$liveIndex=Join-Path $game 'index.html'
$stagedIndex=Join-Path $staged 'index.html'
$relativeFilm='assets/cinematic/mercy-opening.mp4'
$liveFilm=Join-Path $game $relativeFilm
$stagedFilm=Join-Path $staged $relativeFilm
$original=[IO.File]::ReadAllText($liveIndex)
$updated=$original.Replace('video.src="assets/cinematic/mercy-opening.mp4?v=dialogue-type"','video.src="assets/cinematic/mercy-opening.mp4?v=dialogue-walter"')
if ($updated -eq $original -or $updated -cne [IO.File]::ReadAllText($stagedIndex)) { throw 'Live index does not match the verified index plus the expected cache version change.' }
$backup=Join-Path $root ('before-opening-walter-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $backup | Out-Null
Copy-Item -LiteralPath $liveIndex,$liveFilm -Destination $backup
$finalHashes=@((Get-FileHash -LiteralPath $stagedIndex).Hash,(Get-FileHash -LiteralPath $stagedFilm).Hash)
try {
    Copy-Item -LiteralPath $stagedFilm -Destination $liveFilm -Force
    Copy-Item -LiteralPath $stagedIndex -Destination $liveIndex -Force
    if ((Get-FileHash -LiteralPath $liveIndex).Hash -ne $finalHashes[0] -or (Get-FileHash -LiteralPath $liveFilm).Hash -ne $finalHashes[1]) { throw 'Installed files failed checksum verification.' }
} catch {
    Copy-Item -LiteralPath (Join-Path $backup 'mercy-opening.mp4') -Destination $liveFilm -Force
    Copy-Item -LiteralPath (Join-Path $backup 'index.html') -Destination $liveIndex -Force
    throw
}
Write-Output "Installed $liveFilm"
Write-Output "Backup $backup"
Write-Output "SHA256 $($finalHashes[1])"