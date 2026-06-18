$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$serverPidPath = Join-Path $PSScriptRoot ".autoplay-http-server.pid"
if (-not (Test-Path -LiteralPath $serverPidPath)) {
    Write-Output "No autoplay HTTP server pid file was found."
    exit 0
}

$rawPid = (Get-Content -LiteralPath $serverPidPath -ErrorAction Stop | Select-Object -First 1).Trim()
if (-not $rawPid) {
    Remove-Item -LiteralPath $serverPidPath -Force -ErrorAction SilentlyContinue
    Write-Output "Autoplay HTTP server pid file was empty."
    exit 0
}

$serverProcess = Get-Process -Id ([int]$rawPid) -ErrorAction SilentlyContinue
if ($serverProcess) {
    Stop-Process -Id $serverProcess.Id -Force
    Write-Output "Stopped autoplay HTTP server process $($serverProcess.Id)."
} else {
    Write-Output "Autoplay HTTP server process $rawPid was not running."
}

Remove-Item -LiteralPath $serverPidPath -Force -ErrorAction SilentlyContinue
