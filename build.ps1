# Halo Plugin Habit Tracker — Build & Deploy Script
# Usage: .\build.ps1 [-SkipTests] [-Release]
param(
    [switch]$SkipTests,
    [switch]$Release
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$UiDir = Join-Path $ProjectRoot "ui"

Write-Host "===== Halo Habit Tracker Plugin Build =====" -ForegroundColor Cyan

# Step 1: Build frontend
Write-Host "[1/3] Building frontend (Vite + Vue 3)..." -ForegroundColor Yellow
Push-Location $UiDir
try {
    npm ci --silent 2>$null
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
    Write-Host "  Frontend build OK" -ForegroundColor Green
}
finally { Pop-Location }

# Step 2: Build backend
Write-Host "[2/3] Building backend (Gradle + Spring Boot)..." -ForegroundColor Yellow
$gradleArgs = @("build")
if ($Release) { $gradleArgs += "-Prelease=true" }
if ($SkipTests) { $gradleArgs += "-x", "test" }

& .\gradlew @gradleArgs
if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
Write-Host "  Backend build OK" -ForegroundColor Green

# Step 3: Output artifact info
Write-Host "[3/3] Build complete!" -ForegroundColor Yellow
$jar = Get-ChildItem -Path "$ProjectRoot\build\libs" -Filter "*.jar" | Select-Object -First 1
if ($jar) {
    Write-Host "  Artifact: $($jar.FullName)" -ForegroundColor Green
    Write-Host "  Size: $([math]::Round($jar.Length / 1MB, 2)) MB" -ForegroundColor Gray
}

Write-Host "===== Done. Copy the .jar to Halo's plugins/ folder to deploy. =====" -ForegroundColor Cyan
