#!/usr/bin/env bash
# =================================================================
# Script khởi chạy hạ tầng cục bộ (PostgreSQL, RabbitMQ, pgAdmin)
# Dành cho môi trường Linux / macOS
# =================================================================

set -e

echo "==========================================================="
echo "  KHỞI CHẠY HẠ TẦNG DỰ ÁN QTKD (Docker Compose)            "
echo "==========================================================="

if ! command -v docker &> /dev/null; then
    echo "[ERROR] Không tìm thấy docker. Vui lòng cài đặt Docker trước."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "[ERROR] Docker daemon chưa chạy. Vui lòng bật Docker service."
    exit 1
fi

echo "[INFO] Đang khởi chạy các service qua docker compose..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

echo ""
echo ">>> HẠ TẦNG ĐÃ SẴN SÀNG! <<<"
echo "-----------------------------------------------------------"
echo "1. PostgreSQL Database:  localhost:5432 (User: postgres, Pass: postgres, DB: qtkd_db)"
echo "2. pgAdmin 4 Web UI:     http://localhost:5050 (User: admin@qtkd.local, Pass: admin)"
echo "3. RabbitMQ Management:  http://localhost:15672 (User: guest, Pass: guest)"
echo "4. RabbitMQ AMQP Port:   localhost:5672"
echo "-----------------------------------------------------------"
echo "Chạy API bằng lệnh:"
echo "  dotnet run --project src/Api/Qtkd.Api.csproj --launch-profile http"

