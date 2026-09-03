# ================================================================
# ChatGPT AI Platform - Firebase + Cloud Run Deploy Script
# ================================================================
# Usage: .\deploy-firebase.ps1
# Prereqs:
#   1. gcloud CLI installed & authenticated (gcloud auth login)
#   2. gcloud project set: gcloud config set project llm-proj-c7dd4
#   3. Firebase CLI installed (already done)
# ================================================================

$ProjectId    = "llm-proj-c7dd4"
$Region       = "asia-south1"       # Mumbai — lowest latency from India
$ServiceName  = "chatgpt-backend"

# Ensure gcloud is available in PATH
$localGcloud = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin"
if ((Test-Path $localGcloud) -and ($env:PATH -notlike "*$localGcloud*")) {
    $env:PATH = "$localGcloud;$env:PATH"
}

# ---- Read secrets from backend/.env ----
$envFile = "D:\LLM PROJECT\backend\.env"
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$SecretKey       = $envVars["SECRET_KEY"]
$GoogleClientId  = $envVars["GOOGLE_CLIENT_ID"]
$GroqKey         = $envVars["GROQ_API_KEY"]
$OpenAiKey       = $envVars["OPENAI_API_KEY"]
$GeminiKey       = $envVars["GEMINI_API_KEY"]
$DefaultProvider = $envVars["DEFAULT_LLM_PROVIDER"]
$DefaultModel    = $envVars["DEFAULT_LLM_MODEL"]

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  ChatGPT Platform — Firebase + Cloud Run Deployment" -ForegroundColor Cyan
Write-Host "  Project : $ProjectId" -ForegroundColor Cyan
Write-Host "  Region  : $Region (Mumbai)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# ----------------------------------------------------------------
# STEP 1: Deploy Backend to Cloud Run
# ----------------------------------------------------------------
Write-Host ""
Write-Host "[1/3] Deploying FastAPI backend to Cloud Run..." -ForegroundColor Yellow

$cloudRunEnvVars = "SECRET_KEY=$SecretKey," +
                   "GOOGLE_CLIENT_ID=$GoogleClientId," +
                   "DATABASE_URL=sqlite:///./chatgpt_platform.db," +
                   "DEFAULT_LLM_PROVIDER=$DefaultProvider," +
                   "DEFAULT_LLM_MODEL=$DefaultModel," +
                   "GROQ_API_KEY=$GroqKey," +
                   "OPENAI_API_KEY=$OpenAiKey," +
                   "GEMINI_API_KEY=$GeminiKey"

Push-Location "D:\LLM PROJECT\backend"

gcloud run deploy $ServiceName `
    --source . `
    --project $ProjectId `
    --region $Region `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 3 `
    --timeout 120 `
    --set-env-vars $cloudRunEnvVars

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cloud Run deploy failed." -ForegroundColor Red
    Pop-Location; exit 1
}

# Get the deployed Cloud Run URL
$BackendUrl = gcloud run services describe $ServiceName --project $ProjectId --region $Region --format "value(status.url)"
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Green
Pop-Location

# ----------------------------------------------------------------
# STEP 2: Build Frontend with Cloud Run URL injected
# ----------------------------------------------------------------
Write-Host ""
Write-Host "[2/3] Building Next.js frontend for Firebase Hosting..." -ForegroundColor Yellow

Push-Location "D:\LLM PROJECT\frontend"

# Write the production env with the real Cloud Run URL
@"
NEXT_PUBLIC_API_URL=$BackendUrl
NEXT_PUBLIC_GOOGLE_CLIENT_ID=$GoogleClientId
"@ | Set-Content ".env.production"

$env:NEXT_PUBLIC_BUILD_MODE = "export"
npm.cmd run build:firebase

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed." -ForegroundColor Red
    Pop-Location; exit 1
}

Write-Host "Frontend built -> frontend/out/" -ForegroundColor Green
Pop-Location

# ----------------------------------------------------------------
# STEP 3: Deploy Frontend to Firebase Hosting
# ----------------------------------------------------------------
Write-Host ""
Write-Host "[3/3] Deploying to Firebase Hosting..." -ForegroundColor Yellow

Push-Location "D:\LLM PROJECT"
firebase deploy --only hosting --project $ProjectId

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Firebase Hosting deploy failed." -ForegroundColor Red
    Pop-Location; exit 1
}
Pop-Location

# ----------------------------------------------------------------
# Done
# ----------------------------------------------------------------
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "  Frontend : https://$ProjectId.web.app" -ForegroundColor Green
Write-Host "  Backend  : $BackendUrl" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Add these to Google OAuth Authorized JavaScript Origins:" -ForegroundColor Yellow
Write-Host "  https://$ProjectId.web.app" -ForegroundColor Yellow
Write-Host "  https://$ProjectId.firebaseapp.com" -ForegroundColor Yellow
