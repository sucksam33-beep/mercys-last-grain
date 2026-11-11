param([string]$GameSource=(Join-Path $PSScriptRoot '../returning-waters-cinematic-site/.sites-checkout/dist'),
 [string]$InstallerPath=(Join-Path $PSScriptRoot 'ReturningWaters-Setup-x64.exe'),
 [ValidateRange(1,2147483647)][int]$LauncherRevision=2,
 [switch]$PublishLauncher,
 [switch]$UsePublishedGame,
 [switch]$CampaignOpening)
$ErrorActionPreference='Stop'
if($CampaignOpening -and $PublishLauncher){throw 'Windows-only builds cannot be published.'}
$build=Join-Path $PSScriptRoot '.build'
$sdk=Join-Path $build 'webview2'
if(!(Test-Path -LiteralPath (Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'))){throw 'Microsoft WebView2 SDK 1.0.3650.58을 .build/webview2에 압축 해제해 주세요.'}
$stamp=(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[Guid]::NewGuid().ToString('N').Substring(0,6)
$stage=(New-Item -ItemType Directory -Path (Join-Path $build "stage-$stamp")).FullName
$game=Join-Path $stage 'game'
Copy-Item -LiteralPath (Resolve-Path $GameSource).Path -Destination $game -Recurse
if($CampaignOpening){
 & node (Join-Path $PSScriptRoot 'campaign/IntegrateSoilOpening.cjs') $game
 if($LASTEXITCODE){throw 'Campaign integration failed.'}
 foreach($asset in @('SoilOpening.mjs','soil-opening.css','SoilCampaign.js','CharacterGroom.mjs')){
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot "campaign/$asset") -Destination $game
 }
 New-Item -ItemType File -Path (Join-Path $game 'program-only.flag') -Force | Out-Null
 $manifestBuilder=Join-Path (Split-Path (Resolve-Path $GameSource).Path -Parent) 'scripts/MakeWindowsRelease.cjs'
 & node $manifestBuilder $game '왕이 먹는 흙' | Out-Host
 if($LASTEXITCODE){throw 'Campaign manifest failed.'}
}
foreach($file in @('desktop.html','desktop.css','desktop.js','desktop-play.js','desktop-updates.js','asagi-title.jpg')){
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $game
}
if(!$UsePublishedGame -and !$CampaignOpening){
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'UiTheme.css') -Destination $game
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'brunnen.js') -Destination $game
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'brunnen-materials') -Destination (Join-Path $game 'assets/brunnen') -Recurse
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'RegionVisuals.js') -Destination $game
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'BotanicalPlants.js') -Destination $game
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'botanical-plants.png') -Destination (Join-Path $game 'assets')
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'TerrainSamples.js') -Destination $game
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'GameMenu.js') -Destination $game
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'region-materials') -Destination (Join-Path $game 'assets/regions') -Recurse
 & node (Join-Path $PSScriptRoot 'InstallBrunnen.cjs') $game
 if($LASTEXITCODE){throw '브뤼넨 게임 구역을 연결하지 못했습니다.'}
}
$lib=Join-Path $sdk 'lib/net462'
foreach($name in @('Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll')){
 Copy-Item -LiteralPath (Join-Path $lib $name) -Destination $stage
}
Copy-Item -LiteralPath (Join-Path $sdk 'runtimes/win-x64/native/WebView2Loader.dll') -Destination $stage
$icon=Join-Path $PSScriptRoot 'MercysLastGrain.ico'
if(!(Test-Path -LiteralPath $icon -PathType Leaf)){throw 'MercysLastGrain.ico is missing.'}
$csc='C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$gameExe=Join-Path $stage 'ReturningWaters.exe'
$signer=[Security.Cryptography.RSACryptoServiceProvider]::new(3072)
$signer.PersistKeyInCsp=$false
if(!$CampaignOpening){
 Add-Type -AssemblyName System.Security.Cryptography.ProtectedData
 $signing=New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot '.signing')
 $keyPath=Join-Path $signing.FullName 'launcher-signing-key.dpapi'
 $scope=[Security.Cryptography.DataProtectionScope]::CurrentUser
if(Test-Path -LiteralPath $keyPath){
 $private=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($keyPath),$null,$scope)
 try{$signer.FromXmlString([Text.Encoding]::UTF8.GetString($private))}finally{[Array]::Clear($private,0,$private.Length)}
}else{
 if(Test-Path -LiteralPath (Join-Path $GameSource 'updates/launcher.json')){throw '기존 런처 서명 키가 필요합니다. 새 키를 만들면 배포된 런처가 업데이트를 검증할 수 없습니다.'}
 $private=[Text.Encoding]::UTF8.GetBytes($signer.ToXmlString($true))
 try{
  $protected=[Security.Cryptography.ProtectedData]::Protect($private,$null,$scope)
  $stream=[IO.File]::Open($keyPath,[IO.FileMode]::CreateNew)
  try{$stream.Write($protected,0,$protected.Length)}finally{$stream.Dispose()}
 }finally{[Array]::Clear($private,0,$private.Length)}
}
}
$trust=Join-Path $build "LauncherTrust-$stamp.cs"
$public=$signer.ToXmlString($false)
[IO.File]::WriteAllText($trust,"static class LauncherTrust { public const int Revision = $LauncherRevision; public const string PublicKey = `"$public`"; }")
& $csc /nologo /codepage:65001 /target:winexe /platform:x64 "/win32icon:$icon" "/out:$gameExe" /r:System.Web.Extensions.dll /r:System.Security.dll /r:System.Net.Http.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "/r:$(Join-Path $lib 'Microsoft.Web.WebView2.Core.dll')" "/r:$(Join-Path $lib 'Microsoft.Web.WebView2.WinForms.dll')" (Join-Path $PSScriptRoot 'GameWindow.cs') (Join-Path $PSScriptRoot 'ContentUpdates.cs') (Join-Path $PSScriptRoot 'LauncherUpdates.cs') $trust
if($LASTEXITCODE){throw '게임 창 컴파일에 실패했습니다.'}
if($PublishLauncher){
 Add-Type -AssemblyName System.IO.Compression
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $output=New-Item -ItemType Directory -Force -Path (Join-Path $GameSource 'updates')
 $zip=Join-Path $output.FullName "launcher-$LauncherRevision.zip"
 if(Test-Path -LiteralPath $zip){throw '이 런처 버전이 이미 있습니다. 새 버전 번호를 지정해 주세요.'}
 $archive=[IO.Compression.ZipFile]::Open($zip,[IO.Compression.ZipArchiveMode]::Create)
 try{
  foreach($file in @('ReturningWaters.exe','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll','game/desktop.html','game/desktop.css','game/desktop.js','game/desktop-play.js','game/desktop-updates.js','game/asagi-title.jpg')){
   [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,(Join-Path $stage $file),$file,[IO.Compression.CompressionLevel]::Optimal)
  }
 }finally{$archive.Dispose()}
 $size=(Get-Item -LiteralPath $zip).Length
 $hash=(Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
 $path="updates/launcher-$LauncherRevision.zip"
 $canonical="$LauncherRevision`n$path`n$size`n$hash"
 $signature=[Convert]::ToBase64String($signer.SignData([Text.Encoding]::UTF8.GetBytes($canonical),[Security.Cryptography.HashAlgorithmName]::SHA256,[Security.Cryptography.RSASignaturePadding]::Pkcs1))
 $manifest=[ordered]@{revision=$LauncherRevision;path=$path;size=$size;sha256=$hash;signature=$signature}|ConvertTo-Json -Compress
 [IO.File]::WriteAllText((Join-Path $output.FullName 'launcher.json'),$manifest,[Text.UTF8Encoding]::new($false))
}
$signer.Dispose()
$payload=Join-Path $build "payload-$stamp.zip"
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $payload -CompressionLevel Fastest
$installer=$InstallerPath
& $csc /nologo /codepage:65001 /target:winexe /platform:x64 "/win32icon:$icon" "/out:$installer" /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "/resource:$payload,ReturningWaters.Game" (Join-Path $PSScriptRoot 'Setup.cs')
if($LASTEXITCODE){throw '설치 프로그램 컴파일에 실패했습니다.'}
[pscustomobject]@{Installer=$installer;Executable=$gameExe;Stage=$stage} | ConvertTo-Json -Compress
