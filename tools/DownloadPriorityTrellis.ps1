$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$items=Get-Content -Raw -Encoding UTF8 (Join-Path $root 'trellis-86-review/results.json')|ConvertFrom-Json
$out=Join-Path $root 'game/assets/priority-models'
[void][IO.Directory]::CreateDirectory($out)
$downloaded=$items|Where-Object url|ForEach-Object -Parallel {
 $item=$_
 $url=[Uri]$item.url
 if($url.Scheme -ne 'https' -or $url.Host -notmatch '(^|\.)fal\.media$'){throw 'Unexpected Fal output URL'}
 $file=Join-Path $using:out ('{0:000}.glb' -f [int]$item.number)
 if(!(Test-Path -LiteralPath $file)){
  & curl.exe --fail --silent --show-error --location --retry 2 --proto '=https' --max-time 120 --output "$file.part" -- $url.AbsoluteUri
  if($LASTEXITCODE -ne 0){return [pscustomobject]@{number=$item.number;downloaded=$false}}
  $stream=[IO.File]::OpenRead("$file.part")
  try{
   $reader=[IO.BinaryReader]::new($stream)
   if($reader.ReadUInt32() -ne 0x46546c67 -or $reader.ReadUInt32() -ne 2 -or $reader.ReadUInt32() -ne $stream.Length){throw "Invalid GLB $file"}
  }finally{$stream.Dispose()}
  Move-Item -LiteralPath "$file.part" -Destination $file
 }
 [pscustomobject]@{number=$item.number;downloaded=$true}
} -ThrottleLimit 10
$downloaded|ConvertTo-Json|Set-Content -Encoding utf8 (Join-Path $root 'trellis-86-review/downloads.json')
$downloaded|Group-Object downloaded|Select-Object Name,Count
