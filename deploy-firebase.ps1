# ================================================
# ChatGPT AI Platform - Firebase Deploy Script
# ================================================
param(
    [string]$ProjectId = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Firebase Deployment - Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Check Firebase CLI
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Firebase CLI..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

# Step 2: Set Project ID
if ($ProjectId -ne "") {
    (Get-Content "D:\LLM PROJECT\.firebaserc") -replace "your-firebase-project-id", $ProjectId | Set-Content "D:\LLM PROJECT\.firebaserc"
    Write-Host "Project ID set to: $ProjectId" -ForegroundColor Green
}

# Step 3: Build frontend static export
Write-Host "[1/3] Building Next.js frontend for Firebase..." -ForegroundColor Yellow
Set-Location "D:\LLM PROJECT\frontend"
$env:NEXT_PUBLIC_BUILD_MODE = "export"
npm.cmd run build
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend build FAILED" -ForegroundColor Red; exit 1 }
Write-Host "Frontend built successfully -> out/" -ForegroundColor Green

# Step 4: Build & push backend Docker image to Google Cloud Run
Write-Host "[2/3] Deploying backend to Google Cloud Run..." -ForegroundColor Yellow
Set-Location "D:\LLM PROJECT\backend"
$region = "us-central1"
$service = "chatgpt-backend"
gcloud run deploy $service `
    --source . `
    --region $region `
    --allow-unauthenticated `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --set-env-vars "DATABASE_URL=sqlite:///./chatgpt_platform.db,SECRET_KEY=change-me-in-production"
if ($LASTEXITCODE -ne 0) { Write-Host "Cloud Run deploy FAILED" -ForegroundColor Red; exit 1 }
Write-Host "Backend deployed to Cloud Run" -ForegroundColor Green

# Step 5: Deploy frontend to Firebase Hosting
Write-Host "[3/3] Deploying frontend to Firebase Hosting..." -ForegroundColor Yellow
Set-Location "D:\LLM PROJECT"
firebase login --no-localhost
firebase deploy --only hosting
if ($LASTEXITCODE -ne 0) { Write-Host "Firebase Hosting deploy FAILED" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "  App: https://$ProjectId.web.app" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
