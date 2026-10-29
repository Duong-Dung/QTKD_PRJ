#!/usr/bin/env bash
# =================================================================
# Script dừng và thu dọn hạ tầng cục bộ
# Dành cho môi trường Linux / macOS
# =================================================================

echo "==========================================================="
echo "  DỪNG HẠ TẦNG DỰ ÁN QTKD (Docker Compose)                 "
echo "==========================================================="

if command -v docker-compose &> /dev/null; then
    docker-compose down
else
    docker compose down
fi

echo "[INFO] Đã dừng toàn bộ các container hạ tầng."
