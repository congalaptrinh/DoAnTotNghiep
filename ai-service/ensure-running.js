// Khởi động AI Service nếu chưa chạy (cổng 8001). Idempotent, không chặn: được gọi tự động
// từ `npm run dev`/`npm start` của backend và `npm run dev` của web (xem package.json).
const net = require('net');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8001;
const dir = __dirname;
const py = path.join(dir, 'venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');

const sock = net.connect({ port: PORT, host: '127.0.0.1' });
sock.on('connect', () => { sock.destroy(); console.log('[ai-service] đã chạy sẵn'); });
sock.on('error', () => {
  if (!fs.existsSync(py)) {
    console.warn('[ai-service] chưa cài venv (xem ai-service/README.md) — bỏ qua, "Nhập kho bằng AI" sẽ không dùng được');
    return;
  }
  const log = fs.openSync(path.join(dir, 'ai-service.log'), 'a');
  spawn(py, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: dir, detached: true, stdio: ['ignore', log, log], windowsHide: true,
  }).unref();
  console.log('[ai-service] đang khởi động nền (nạp model vài giây), log: ai-service/ai-service.log');
});
