param(
 [string]$SdkPath = '',
 [string]$OutputPath = ''
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (!$OutputPath) { $OutputPath = Join-Path $projectRoot 'dist' }
$OutputPath = [IO.Path]::GetFullPath($OutputPath)
$buildRoot = Join-Path $projectRoot '.build'
[IO.Directory]::CreateDirectory($buildRoot) | Out-Null
if (!$SdkPath) {
 $SdkPath = Join-Path $buildRoot 'webview2-1.0.3650.58'
 if (!(Test-Path -LiteralPath (Join-Path $SdkPath 'lib/net462/Microsoft.Web.WebView2.Core.dll'))) {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $packagePath = Join-Path $buildRoot 'webview2-1.0.3650.58.zip'
  Invoke-WebRequest -UseBasicParsing -Uri 'https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/1.0.3650.58/microsoft.web.webview2.1.0.3650.58.nupkg' -OutFile $packagePath
  Expand-Archive -LiteralPath $packagePath -DestinationPath $SdkPath -Force
 }
}
$libraryRoot = Join-Path $SdkPath 'lib/net462'
foreach ($file in @('Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll')) {
 if (!(Test-Path -LiteralPath (Join-Path $libraryRoot $file))) { throw "WebView2 SDK file missing: $file" }
}
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (!(Test-Path -LiteralPath $compiler)) { throw '.NET Framework x64 C# compiler is missing.' }
$gameSource = Join-Path $projectRoot 'game'
$largestAsset = Join-Path $gameSource 'assets/cinematic/mercy-opening.mp4'
if (!(Test-Path -LiteralPath $largestAsset) -or (Get-Item -LiteralPath $largestAsset).Length -lt 1000) {
 throw 'Game assets are missing or are Git LFS pointers. Run git lfs pull first.'
}
if ($OutputPath -eq $projectRoot -or $OutputPath.StartsWith($gameSource + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) -or $OutputPath -eq $gameSource) {
 throw 'OutputPath must not overwrite the project root or source game directory.'
}
[IO.Directory]::CreateDirectory($OutputPath) | Out-Null
$gameOutput = Join-Path $OutputPath 'game'
[IO.Directory]::CreateDirectory($gameOutput) | Out-Null
Get-ChildItem -LiteralPath $gameSource -Force | ForEach-Object {
 Copy-Item -LiteralPath $_.FullName -Destination $gameOutput -Recurse -Force
}
[IO.File]::WriteAllBytes((Join-Path $gameOutput 'program-only.flag'),[byte[]]@())
foreach ($file in @('Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll')) {
 Copy-Item -LiteralPath (Join-Path $libraryRoot $file) -Destination $OutputPath -Force
}
Copy-Item -LiteralPath (Join-Path $SdkPath 'runtimes/win-x64/native/WebView2Loader.dll') -Destination $OutputPath -Force
$rsa = New-Object Security.Cryptography.RSACryptoServiceProvider -ArgumentList 3072
$rsa.PersistKeyInCsp = $false
try { $publicKey = $rsa.ToXmlString($false) } finally { $rsa.Dispose() }
$trustPath = Join-Path $buildRoot 'LauncherTrust.cs'
$trustSource = 'static class LauncherTrust { public const int Revision = 1; public const string PublicKey = "' + $publicKey + '"; }'
[IO.File]::WriteAllText($trustPath,$trustSource,[Text.UTF8Encoding]::new($false))
$sourceFiles = @('GameWindow.cs','ContentUpdates.cs','LauncherUpdates.cs') | ForEach-Object { Join-Path $projectRoot "src/$_" }
& $compiler /nologo /codepage:65001 /target:winexe /platform:x64 "/win32icon:$(Join-Path $projectRoot 'branding/MercysLastGrain.ico')" "/out:$(Join-Path $OutputPath 'ReturningWaters.exe')" /r:System.Web.Extensions.dll /r:System.Security.dll /r:System.Net.Http.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "/r:$(Join-Path $libraryRoot 'Microsoft.Web.WebView2.Core.dll')" "/r:$(Join-Path $libraryRoot 'Microsoft.Web.WebView2.WinForms.dll')" $sourceFiles $trustPath
if ($LASTEXITCODE) { throw "C# compilation failed: $LASTEXITCODE" }
Write-Output "Built: $(Join-Path $OutputPath 'ReturningWaters.exe')"
