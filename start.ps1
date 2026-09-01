# ChatGPT AI Platform - One-click startup script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ChatGPT AI Platform - Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Kill anything on ports 8000 and 3000
$ports = @(8000, 3000)
foreach ($port in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($proc) { Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue }
}
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "[1/3] Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -Command `"Set-Location 'D:\LLM PROJECT\backend'; & 'D:\LLM PROJECT\.venv\Scripts\python.exe' -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`"" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting Cloudflare Public Tunnel for Firebase & Online Users..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -Command `"Set-Location 'D:\LLM PROJECT'; & 'D:\LLM PROJECT\cloudflared.exe' tunnel --url http://localhost:8000`"" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "[3/3] Starting Next.js frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -Command `"Set-Location 'D:\LLM PROJECT\frontend'; npm.cmd run dev`"" -WindowStyle Normal

Start-Sleep -Seconds 4

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  READY!" -ForegroundColor Green
Write-Host "  Local Web App:    http://localhost:3000" -ForegroundColor Green
Write-Host "  Firebase Live:    https://llm-proj-c7dd4.web.app" -ForegroundColor Green
Write-Host "  Backend API:      http://localhost:8000" -ForegroundColor Green  
Write-Host "  API Docs:         http://localhost:8000/docs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Start-Process "http://localhost:3000"
