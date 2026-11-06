# =================================================================
# Script khởi chạy hạ tầng cục bộ (PostgreSQL, RabbitMQ, pgAdmin)
# Dành cho môi trường Windows PowerShell
# =================================================================

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  KHỞI CHẠY HẠ TẦNG DỰ ÁN QTKD (Docker Compose)            " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

# Kiểm tra Docker daemon
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Docker chưa được bật! Vui lòng khởi động Docker Desktop trước." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Không tìm thấy lệnh docker. Vui lòng cài đặt Docker Desktop." -ForegroundColor Red
    exit 1
}

# Khởi chạy các container nền
Write-Host "[INFO] Đang khởi chạy các service nền qua docker-compose..." -ForegroundColor Yellow
if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    docker-compose up -d postgres rabbitmq pgadmin
} else {
    docker compose up -d postgres rabbitmq pgadmin
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host ">>> HẠ TẦNG ĐÃ SẴN SÀNG! <<<" -ForegroundColor Green
    Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
    Write-Host "1. PostgreSQL Database:  localhost:5432 (User: postgres, Pass: postgres, DB: qtkd_db)" -ForegroundColor White
    Write-Host "2. pgAdmin 4 Web UI:     http://localhost:5050 (User: admin@qtkd.com, Pass: admin)" -ForegroundColor White
    Write-Host "3. RabbitMQ Management:  http://localhost:15672 (User: guest, Pass: guest)" -ForegroundColor White
    Write-Host "4. RabbitMQ AMQP Port:   localhost:5672" -ForegroundColor White
    Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
    Write-Host "Bây giờ bạn có thể chạy API bằng lệnh:" -ForegroundColor Yellow
    Write-Host "  dotnet run --project src/Api/Qtkd.Api.csproj --launch-profile http" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Khởi chạy thất bại! Vui lòng kiểm tra log lỗi bên trên." -ForegroundColor Red
}
