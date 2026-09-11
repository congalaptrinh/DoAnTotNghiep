const path = require('path');

// Nạp .env.test TRƯỚC khi bất kỳ test file nào require('../src/app') (và qua đó
// require('../src/utils/prisma') khởi tạo PrismaClient) — đảm bảo test luôn chạy
// trên warehouse_test_db, không bao giờ đụng vào DB dev.
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test'), override: true });
