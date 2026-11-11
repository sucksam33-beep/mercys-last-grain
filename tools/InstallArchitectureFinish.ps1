$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$live=Join-Path $root 'game'
$stage=Join-Path $root 'architecture-stage/game'
$baseline=Join-Path $root 'architecture-stage/baseline'
$existing=@('BuildingVariation.js','index.html')
$newFile='ArchitectureFinish.js'
if(Test-Path -LiteralPath (Join-Path $live $newFile)){throw 'ArchitectureFinish.js already exists in the live game.'}
foreach($file in $existing){
 if((Get-FileHash (Join-Path $live $file)).Hash -ne (Get-FileHash (Join-Path $baseline $file)).Hash){throw "Live game changed: $file"}
}
$backup=Join-Path $root ('before-architecture-finish-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $backup | Out-Null
foreach($file in $existing){Copy-Item -LiteralPath (Join-Path $live $file) -Destination (Join-Path $backup $file)}
try {
 foreach($file in @($newFile)+$existing){
  $source=Join-Path $stage $file
  $target=Join-Path $live $file
  Copy-Item -LiteralPath $source -Destination $target -Force
  if((Get-FileHash $source).Hash -ne (Get-FileHash $target).Hash){throw "Installed file differs: $file"}
 }
} catch {
 foreach($file in $existing){Copy-Item -LiteralPath (Join-Path $backup $file) -Destination (Join-Path $live $file) -Force}
 $added=Join-Path $live $newFile
 if(Test-Path -LiteralPath $added){Remove-Item -LiteralPath $added -Force}
 throw
}
Write-Output "Installed architecture finish. Backup: $backup"
