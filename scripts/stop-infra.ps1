# =================================================================
# Script dừng và thu dọn hạ tầng cục bộ
# Dành cho môi trường Windows PowerShell
# =================================================================

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  DỪNG HẠ TẦNG DỰ ÁN QTKD (Docker Compose)                 " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    docker-compose down
} else {
    docker compose down
}

Write-Host "[INFO] Đã dừng toàn bộ các container hạ tầng." -ForegroundColor Green

