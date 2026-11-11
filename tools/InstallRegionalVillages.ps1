$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$live=Join-Path $root 'game'
$stage=Join-Path $root 'dialogue-opening-stage/game'
$baseline=Join-Path $root 'dialogue-opening-stage/village-baseline'
$files=@('VillageCharacter.js','SettlementExpansion.js','BuildingVariation.js','index.html')
foreach($file in $files){
 if((Get-FileHash (Join-Path $live $file)).Hash -ne (Get-FileHash (Join-Path $baseline $file)).Hash){throw "Live game changed during verification: $file"}
}
$files=@('VillageCharacter.js','SettlementExpansion.js','BuildingVariation.js','index.html')
$backup=Join-Path $root ('before-regional-villages-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Force (Join-Path $backup 'assets/cinematic') | Out-Null
foreach($file in $files){Copy-Item -LiteralPath (Join-Path $live $file) -Destination (Join-Path $backup $file)}
try {
 foreach($file in $files){
  $source=Join-Path $stage $file
  $target=Join-Path $live $file
  Copy-Item -LiteralPath $source -Destination $target -Force
  if((Get-FileHash $source).Hash -ne (Get-FileHash $target).Hash){throw "Installed file differs: $file"}
 }
} catch {
 foreach($file in $files){Copy-Item -LiteralPath (Join-Path $backup $file) -Destination (Join-Path $live $file) -Force}
 throw
}
Write-Output "Installed $($files.Count) verified files. Backup: $backup"
