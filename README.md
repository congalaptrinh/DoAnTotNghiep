# Đồ Án Tốt Nghiệp — Hệ thống Quản lý Kho (TechStore WMS)

Hệ thống quản lý kho linh kiện điện tử: Database (PostgreSQL) + Backend (Node/Express) + Web (React) + Mobile (Flutter) + AI Service (Python/YOLOv9, nhận diện linh kiện qua ảnh chụp).

## Chạy dự án (lần đầu)

### 1. Cài công cụ cần có
Docker Desktop, Node.js 20+, Flutter SDK (nếu chạy app Mobile).

### 2. Khởi động Database + AI Service (chỉ 1 lệnh, chạy nền tới khi tắt Docker)

```bash
cd backend
docker compose up -d
```

Lệnh này khởi động **cả PostgreSQL lẫn AI Service** cùng lúc, chạy nền vĩnh viễn cho tới khi bạn `docker compose down` — không phụ thuộc terminal nào đang mở, không cần biết khái niệm "AI Service" là gì hay phải tự chạy nó riêng. Lần đầu chạy sẽ tự build image AI Service (vài phút, tải model + thư viện Python). Kiểm tra đã sẵn sàng: `curl http://localhost:8001/health`.

### 3. Khởi động Backend

```bash
cd backend
npm install
cp .env.example .env          # sửa lại nếu cần
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend chạy ở `http://localhost:5000`, tự kết nối tới PostgreSQL và AI Service đã chạy ở bước 2 (qua biến `AI_SERVICE_URL` trong `.env`).

### 4. Khởi động Web

```bash
cd web
npm install
npm run dev
```

Mở trình duyệt tới địa chỉ Vite in ra (mặc định `http://localhost:8443`).

### 5. Chạy Mobile (tuỳ chọn, cần thiết bị Android thật hoặc máy ảo)

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://<IP-máy-chạy-Backend>:5000/api
```

## Những lần chạy sau

Chỉ cần lặp lại bước 2 (`docker compose up -d`, nếu đã tắt Docker) rồi bước 3/4/5 (`npm run dev`/`flutter run`) — không cần cài đặt lại.

Dừng toàn bộ: `docker compose down` (trong `backend/`), tắt các cửa sổ `npm run dev`/`flutter run`.

## Chi tiết từng phần

| Phần | README riêng |
|---|---|
| Backend | `backend/` (xem `.env.example`) |
| AI Service | `ai-service/README.md` |
| Web | `web/` |
| Mobile | `mobile/README.md` |
| Tài liệu thiết kế/quyết định kỹ thuật | `specs/` |
