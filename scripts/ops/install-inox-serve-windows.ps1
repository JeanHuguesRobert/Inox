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

$launcher = Join-Path $secretsDir "run-inox-serve-$nodeSlug.ps1"
@'
$ErrorActionPreference = "Stop"
$envFile = "__ENV_FILE__"
if (-not (Test-Path $envFile)) { throw "Missing env file: $envFile" }
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$' -and $line.TrimStart() -notmatch '^#') {
    Set-Item -Path ("env:" + $Matches[1]) -Value $Matches[2].Trim().Trim('"').Trim("'")
  }
}
Set-Location "__INOX_ROOT__"
& node "__SERVE_SCRIPT__"
'@.Replace('__ENV_FILE__', $EnvFile).Replace('__INOX_ROOT__', $inoxRoot).Replace('__SERVE_SCRIPT__', $serveScript) |
  Set-Content -Encoding utf8 $launcher

if (-not $SkipTask) {
  $taskName = "InoxServeCapableHost"
  $pwsh = (Get-Command pwsh).Source
  $action = New-ScheduledTaskAction -Execute $pwsh -Argument "-NoProfile -WindowStyle Hidden -File `"$launcher`""
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "inox-serve retrieval fulfiller on $nodeSlug (port $Port)" -Force | Out-Null
  Write-Host "Registered scheduled task: $taskName (at logon)"
}

# Stop any existing listener on the port (best effort)
Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

if (-not $SkipTask) {
  $pwsh = (Get-Command pwsh).Source
}
Start-Process -FilePath $pwsh -ArgumentList @("-NoProfile", "-WindowStyle", "Hidden", "-File", $launcher) -WorkingDirectory $inoxRoot
Start-Sleep -Seconds 4

$healthUrl = "http://${BindHost}:${Port}/health"
$tokenLine = (Get-Content $EnvFile | Where-Object { $_ -match '^INOX_SERVE_TOKEN=' }) -replace '^INOX_SERVE_TOKEN=', ''
$headers = @{ Authorization = "Bearer $tokenLine" }
$health = Invoke-RestMethod -Uri $healthUrl -Headers $headers -TimeoutSec 10
if (-not $health.ok) { throw "inox-serve health failed" }

Write-Host "inox-serve healthy at $healthUrl"
Write-Host "  service: $($health.service)"
Write-Host "  session_protocol: $($health.session_protocol)"
Write-Host "  launcher: $launcher"
Write-Host "  env:      $EnvFile"