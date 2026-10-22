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

#### Dữ liệu demo thực tế (khuyến nghị thay cho `prisma:seed`)

`npm run prisma:seed` chỉ tạo 4 vai trò + 1 tài khoản admin (dữ liệu tối thiểu). Để có dữ liệu demo đầy đủ và thực tế — danh mục/vật tư linh kiện điện tử, kho, nhà cung cấp, lịch sử nhập/xuất/chuyển/thu hồi/kiểm kê/thanh lý trong 30 ngày gần nhất — chạy thêm:

```bash
npm run seed:demo
```

Script này tự dọn sạch dữ liệu demo/test cũ trước khi tạo lại, nên chạy lại bao nhiêu lần cũng được (không bị trùng). Chi tiết: `backend/prisma/seed-demo.js`.

**Tài khoản demo** (mật khẩu chung `Demo@2026`, riêng admin giữ nguyên `Admin@123`):

| Email | Vai trò | Mật khẩu |
|---|---|---|
| admin@warehouse.local | Quản trị hệ thống | `Admin@123` |
| minh.nguyen@techstore.vn | Quản lý kho | `Demo@2026` |
| lan.tran@techstore.vn | Nhân viên kho | `Demo@2026` |
| duc.pham@techstore.vn | Người xem báo cáo | `Demo@2026` |

Bảng đối chiếu 61 lớp AI nhận diện được với mã vật tư demo tương ứng: `ai-service/class_mapping.md`.

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
