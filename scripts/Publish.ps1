param([string]$Owner = 'sucksam33-beep')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$repositoryName = 'mercys-last-grain'
$remoteUrl = "https://github.com/$Owner/$repositoryName.git"
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'Never'
$credentialLines = "protocol=https`nhost=github.com`nusername=$Owner`n`n" | git credential fill 2>$null
if ($LASTEXITCODE) { throw 'GitHub login required: git credential-manager github login --username sucksam33-beep --device' }
$credentialFields = @{}
foreach ($line in $credentialLines) {
 $parts = $line -split '=', 2
 if ($parts.Length -eq 2) { $credentialFields[$parts[0]] = $parts[1] }
}
if (!$credentialFields.password) { throw 'GitHub credential is unavailable.' }
$headers = @{ Authorization = 'Bearer ' + $credentialFields.password; Accept = 'application/vnd.github+json'; 'X-GitHub-Api-Version' = '2022-11-28' }
try {
 $identity = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $headers -TimeoutSec 30
 if ($identity.login -ne $Owner) { throw 'The authenticated GitHub account does not match the intended repository owner.' }
 $repository = $null
 try { $repository = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$repositoryName" -Headers $headers -TimeoutSec 30 }
 catch { if ([int]$_.Exception.Response.StatusCode -ne 404) { throw } }
 if (!$repository) {
  $body = @{ name = $repositoryName; private = $false; description = "Mercy's Last Grain - Korean 3D open-world game: Windows source, assets and build instructions"; auto_init = $false } | ConvertTo-Json
  $repository = Invoke-RestMethod -Method Post -Uri 'https://api.github.com/user/repos' -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 30
 }
 if ($repository.private -or $repository.full_name -ne "$Owner/$repositoryName") { throw 'Repository identity or public visibility does not match the request.' }
} finally {
 $headers = $null
 $credentialLines = $null
 $credentialFields = $null
}
$remoteNames = @(git -C $projectRoot remote)
if ($LASTEXITCODE) { throw 'Cannot list Git remotes.' }
if ($remoteNames -contains 'origin') {
 $configuredRemote = git -C $projectRoot remote get-url origin
 if ($LASTEXITCODE) { throw 'Cannot read origin.' }
 if ($configuredRemote -ne $remoteUrl) { throw 'Existing origin points to a different repository.' }
} else {
 git -C $projectRoot remote add origin $remoteUrl
 if ($LASTEXITCODE) { throw 'Cannot add origin.' }
}
git -C $projectRoot lfs push origin main
if ($LASTEXITCODE) { throw 'Git LFS upload failed.' }
git -C $projectRoot push -u origin main
if ($LASTEXITCODE) { throw 'Git push failed; no force push was attempted.' }
$localHead = git -C $projectRoot rev-parse HEAD
$remoteHead = git -C $projectRoot ls-remote origin refs/heads/main
if ($LASTEXITCODE -or !($remoteHead -like "$localHead*")) { throw 'Remote main does not match local HEAD.' }
Write-Output "Published and verified: https://github.com/$Owner/$repositoryName"
