// Chạy tự động trước `npm test` (npm lifecycle "pretest"): reset sạch DB test
// (`warehouse_test_db`) về đúng schema hiện tại + seed lại 4 role + admin,
// đảm bảo `npm test` luôn chạy từ trạng thái sạch, lặp lại được nhiều lần.
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

const env = { ...process.env };

console.log('[setupTestDb] DATABASE_URL =', env.DATABASE_URL);

console.log('[setupTestDb] Resetting test database (migrate reset --force)...');
execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit', env, cwd: path.join(__dirname, '..') });

console.log('[setupTestDb] Seeding test database...');
execSync('node prisma/seed.js', { stdio: 'inherit', env, cwd: path.join(__dirname, '..') });

console.log('[setupTestDb] Done.');
