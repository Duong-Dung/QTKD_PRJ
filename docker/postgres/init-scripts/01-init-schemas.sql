-- Khởi tạo extensions cần thiết cho toàn bộ hệ thống
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Bắt buộc cho ràng buộc chống chồng daterange (PRC-03)

-- Khởi tạo các Schema độc lập cho từng Module (Kiến trúc Modular Monolith)
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS customers;
CREATE SCHEMA IF NOT EXISTS contracts;
CREATE SCHEMA IF NOT EXISTS pricing;
CREATE SCHEMA IF NOT EXISTS production;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS esign;
CREATE SCHEMA IF NOT EXISTS notifications;

-- Cấp quyền truy cập đầy đủ trên các schema cho user mặc định
GRANT ALL ON SCHEMA identity TO postgres;
GRANT ALL ON SCHEMA customers TO postgres;
GRANT ALL ON SCHEMA contracts TO postgres;
GRANT ALL ON SCHEMA pricing TO postgres;
GRANT ALL ON SCHEMA production TO postgres;
GRANT ALL ON SCHEMA payments TO postgres;
GRANT ALL ON SCHEMA workflow TO postgres;
GRANT ALL ON SCHEMA audit TO postgres;
GRANT ALL ON SCHEMA esign TO postgres;
GRANT ALL ON SCHEMA notifications TO postgres;

