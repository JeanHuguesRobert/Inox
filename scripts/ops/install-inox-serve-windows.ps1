# Deploy inox-serve on this Windows capable host (owner-operated).
# Secrets live in %USERPROFILE%\.cogentia\secrets\ — never in git.
param(
  [string]$EnvFile = "",
  [string]$SurveyEnv = "C:\tweesic\survey\.env",
  [string]$BindHost = "127.0.0.1",
  [int]$Port = 8792,
  [switch]$SkipTask
)

$ErrorActionPreference = "Stop"
$nodeSlug = ([System.Net.Dns]::GetHostName()).ToLower()
$inoxRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$serveScript = Join-Path $inoxRoot "bin\inox-serve.js"

if (-not $EnvFile) {
  $EnvFile = Join-Path $env:USERPROFILE ".cogentia\secrets\inox-serve-$nodeSlug.env"
}
$secretsDir = Split-Path $EnvFile -Parent
New-Item -ItemType Directory -Force -Path $secretsDir | Out-Null

if (-not (Test-Path $EnvFile)) {
  if (-not (Test-Path $SurveyEnv)) {
    throw "Survey env not found: $SurveyEnv"
  }
  $wanted = @("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY")
  $parsed = @{}
  foreach ($line in Get-Content $SurveyEnv) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$' -and $line.TrimStart() -notmatch '^#') {
      $parsed[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
  foreach ($key in $wanted) {
    if (-not $parsed[$key]) { throw "Missing $key in $SurveyEnv" }
  }
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $token = [Convert]::ToBase64String($bytes) -replace '[^a-zA-Z0-9]', '' | Select-Object -First 1
  if ($token.Length -lt 32) { $token = -join ($bytes | ForEach-Object { '{0:x2}' -f $_ }) }
  @(
    "# inox-serve capable host — $nodeSlug"
    "# Private file — never commit"
    "INOX_SERVE_HOST=$BindHost"
    "INOX_SERVE_PORT=$Port"
    "INOX_SERVE_TOKEN=$token"
    "INOX_SERVE_RUNTIME=sidecar"
    "INOX_SERVE_WORKERS=2"
    "INOX_SERVE_SESSION_WORKERS=1"
    "INOX_SERVE_TIMEOUT_MS=90000"
    "COGENTIA_RETRIEVAL_CORPUS_KEY=cogentia-public"
    "SUPABASE_URL=$($parsed.SUPABASE_URL)"
    "SUPABASE_SERVICE_ROLE_KEY=$($parsed.SUPABASE_SERVICE_ROLE_KEY)"
    "OPENAI_API_KEY=$($parsed.OPENAI_API_KEY)"
  ) | Set-Content -Encoding utf8 $EnvFile
  Write-Host "Created $EnvFile (token generated)"
} else {
  Write-Host "Using existing $EnvFile"
}

$launcher = Join-Path $secretsDir "run-inox-serve-$nodeSlug.cmd"
$startScript = Join-Path $inoxRoot "scripts\ops\start-inox-serve-windows.js"
$nodeExe = (Get-Command node).Source
@"
@echo off
setlocal
set "INOX_SERVE_ENV_FILE=$EnvFile"
cd /d "$inoxRoot"
"$nodeExe" "$startScript" --env-file "$EnvFile"
exit /b %ERRORLEVEL%
"@ | Set-Content -Encoding ascii $launcher

$taskName = "InoxServeCapableHost"

# Stop task + port listeners before starting a fresh instance.
try {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue | Out-Null
  Start-Sleep -Seconds 1
} catch { }

Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

if (-not $SkipTask) {
  $action = New-ScheduledTaskAction `
    -Execute $nodeExe `
    -Argument "`"$startScript`" --env-file `"$EnvFile`"" `
    -WorkingDirectory $inoxRoot
  $logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  $settings = New-ScheduledTaskSettingsSet `
    -Hidden `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -DontStopOnIdleEnd `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Seconds 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)
  try {
    $startupTrigger = New-ScheduledTaskTrigger -AtStartup
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($logonTrigger, $startupTrigger) -Settings $settings -Description "inox-serve retrieval fulfiller on $nodeSlug (port $Port)" -Force | Out-Null
    Write-Host "Registered scheduled task: $taskName (at logon + at startup)"
  } catch {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $logonTrigger -Settings $settings -Description "inox-serve retrieval fulfiller on $nodeSlug (port $Port)" -Force | Out-Null
    Write-Host "Registered scheduled task: $taskName (at logon only — run elevated for AtStartup)"
  }
  schtasks /Run /TN $taskName | Out-Null
  Write-Host "Triggered task: $taskName"
}

if ($SkipTask) {
  $nodeExe = (Get-Command node).Source
  Start-Process -FilePath $nodeExe -ArgumentList @("`"$startScript`"", "--env-file", "`"$EnvFile`"") -WorkingDirectory $inoxRoot -WindowStyle Hidden
}
$envHost = (Get-Content $EnvFile | Where-Object { $_ -match '^INOX_SERVE_HOST=' }) -replace '^INOX_SERVE_HOST=', '' -replace '\s', ''
$healthHost = if ($envHost -eq '0.0.0.0') { '127.0.0.1' } elseif ($envHost) { $envHost } else { $BindHost }
$envPort = (Get-Content $EnvFile | Where-Object { $_ -match '^INOX_SERVE_PORT=' }) -replace '^INOX_SERVE_PORT=', '' -replace '\s', ''
$healthPort = if ($envPort) { [int]$envPort } else { $Port }
$healthUrl = "http://${healthHost}:${healthPort}/health"
$tokenLine = (Get-Content $EnvFile | Where-Object { $_ -match '^INOX_SERVE_TOKEN=' }) -replace '^INOX_SERVE_TOKEN=', ''
$headers = @{ Authorization = "Bearer $tokenLine" }

$health = $null
$lastError = 'not_ready'
for ($attempt = 1; $attempt -le 20; $attempt++) {
  Start-Sleep -Seconds 2
  $listening = Get-NetTCPConnection -LocalPort $healthPort -State Listen -ErrorAction SilentlyContinue
  if (-not $listening) { continue }
  try {
    $health = Invoke-RestMethod -Uri $healthUrl -Headers $headers -TimeoutSec 10
    if ($health.ok) { break }
    $lastError = 'health_not_ok'
  } catch {
    $lastError = $_.Exception.Message
  }
}
if (-not $health -or -not $health.ok) {
  throw "inox-serve health failed after retries ($healthUrl): $lastError"
}

Write-Host "inox-serve healthy at $healthUrl"
Write-Host "  service: $($health.service)"
Write-Host "  session_protocol: $($health.session_protocol)"
Write-Host "  launcher: $launcher"
Write-Host "  env:      $EnvFile"