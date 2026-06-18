$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$pythonPath = "C:\Users\USER\AppData\Local\Programs\Python\Python310\python.exe"
if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "Python executable not found at $pythonPath"
}

$browserCandidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)
$browserPath = $browserCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $browserPath) {
    throw "Chrome or Edge executable was not found."
}

$gameUrl = "http://127.0.0.1:8000/"
$serverPidPath = Join-Path $PSScriptRoot ".autoplay-http-server.pid"
$serverStdoutPath = Join-Path $PSScriptRoot ".autoplay-http-server.out.log"
$serverStderrPath = Join-Path $PSScriptRoot ".autoplay-http-server.err.log"
$browserProfileDir = Join-Path $PSScriptRoot ".autoplay-browser-profile"

$serverReachable = $false
try {
    $probe = Invoke-WebRequest -Uri $gameUrl -UseBasicParsing -TimeoutSec 2
    $serverReachable = $probe.StatusCode -ge 200 -and $probe.StatusCode -lt 500
} catch {
    $serverReachable = $false
}

if (-not $serverReachable) {
    $serverProcess = Start-Process `
        -FilePath $pythonPath `
        -ArgumentList @("-m", "http.server", "8000", "--bind", "127.0.0.1") `
        -WorkingDirectory $PSScriptRoot `
        -RedirectStandardOutput $serverStdoutPath `
        -RedirectStandardError $serverStderrPath `
        -WindowStyle Hidden `
        -PassThru

    Set-Content -LiteralPath $serverPidPath -Value $serverProcess.Id -Encoding ascii

    $deadline = (Get-Date).AddSeconds(10)
    do {
        Start-Sleep -Milliseconds 250
        try {
            $probe = Invoke-WebRequest -Uri $gameUrl -UseBasicParsing -TimeoutSec 2
            $serverReachable = $probe.StatusCode -ge 200 -and $probe.StatusCode -lt 500
        } catch {
            $serverReachable = $false
        }
    } while (-not $serverReachable -and (Get-Date) -lt $deadline)

    if (-not $serverReachable) {
        throw "Local HTTP server did not become reachable at $gameUrl"
    }
}

New-Item -ItemType Directory -Force -Path $browserProfileDir | Out-Null

$browserArgs = @(
    "--user-data-dir=$browserProfileDir",
    "--autoplay-policy=no-user-gesture-required",
    "--new-window",
    "--disable-session-crashed-bubble",
    "--no-first-run",
    "--no-default-browser-check",
    $gameUrl
)

Start-Process -FilePath $browserPath -ArgumentList $browserArgs

Write-Output "Opened $gameUrl with autoplay enabled in $browserPath"
