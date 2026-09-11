# 07 — DECISIONS LOG

> File này ghi lại các quyết định **thực tế** phát sinh trong quá trình code mà spec gốc (00–06) chưa nói rõ 100%, hoặc các chi tiết implementation mà các phần sau (Web, Mobile, AI Service) cần biết chính xác để không code lệch.
>
> **AI agent: mỗi khi tự quyết định một chi tiết không có sẵn trong spec (tên field, format response, cấu trúc lỗi, quy ước đặt tên route, enum value...), hãy thêm 1 mục mới vào đây ngay lúc đó — đừng để cuối mới nhớ lại.**

Định dạng mỗi mục:

```
## [Ngày] — [Tên quyết định ngắn gọn]
- Bối cảnh: vì sao cần quyết định
- Quyết định: chọn gì
- Ảnh hưởng tới: (Backend / Web / Mobile / AI Service — phần nào cần biết điều này)
```

---

## 2026-09-11 — Cấu trúc thư mục Backend
- Bối cảnh: spec không quy định cụ thể cấu trúc folder (B1).
- Quyết định: `src/{routes,controllers,services,middlewares,utils,validators}` chứa toàn bộ code backend; `prisma/` (schema.prisma, migrations/, seed.js) đặt ở **root** của `backend/`, KHÔNG lồng trong `src/` — vì đây là convention chuẩn của Prisma CLI (`prisma migrate`, `prisma studio`... đều tìm `prisma/schema.prisma` ở root theo mặc định, không cần cấu hình thêm). Prisma client singleton đặt tại `src/utils/prisma.js`. `tests/` và `postman/` cũng ở root `backend/`.
- Ảnh hưởng tới: Backend (mọi file code sau này phải theo đúng cấu trúc này, không tạo `src/prisma` hay đặt schema nơi khác).

## 2026-09-11 — npm install-scripts approve cho native/postinstall packages
- Bối cảnh: viết lại backend từ đầu (code cũ mất do cài lại Windows). npm bản mới trên máy (11.19.0) mặc định CHẶN install script (preinstall/install/postinstall) của package lạ trừ khi được approve tường minh — `bcrypt`, `prisma`, `@prisma/client`, `@prisma/engines`, `@parcel/watcher`, `unrs-resolver` đều cần chạy script này để build native binding / tải engine binary.
- Quyết định: chạy `npm install-scripts approve <pkg>` cho đúng 6 package trên (không dùng `--ignore-scripts` hay hạ cấp bảo mật toàn cục). Danh sách approve được lưu vào `package.json` (key `allowScripts`) nên lần install sau không cần approve lại.
- Ảnh hưởng tới: Backend — bất kỳ ai clone repo mới, chạy `npm install` trên máy có npm mới tương tự có thể thấy cảnh báo tương tự; xem `package.json.allowScripts` hoặc chạy `npm install-scripts approve` lại nếu bcrypt/Prisma lỗi native binding.

## 2026-09-11 — Docker Compose Postgres: user/db riêng thay vì mặc định `postgres`
- Bối cảnh: `06-BUILD-CHECKLIST.md` A1 chỉ yêu cầu container tên `warehouse_postgres`, không chốt sẵn user/password/db name cụ thể.
- Quyết định: user=`warehouse`, password=`warehouse`, database=`warehouse_db`, port map `5432:5432`, named volume `warehouse_postgres_data`. `DATABASE_URL` trong `.env` dùng đúng bộ này.
- Ảnh hưởng tới: Backend — ai chạy lại `docker compose up -d` trong `backend/` sẽ có đúng thông tin này; nếu cần đổi, sửa cả `docker-compose.yml` lẫn `.env`.

## 2026-09-11 — Chi tiết schema.prisma không nói rõ 100% trong 01-DATABASE-SCHEMA.md
- Bối cảnh: viết `schema.prisma` (A2), vài chi tiết field không được đánh dấu rõ nullable/required hoặc kiểu dữ liệu cụ thể trong spec.
- Quyết định:
  - `items.category_id`: **bắt buộc** (không nullable) — spec không đánh dấu "nullable" cho field này (khác với `import_orders.supplier_id` có đánh dấu rõ), nên mọi vật tư phải thuộc 1 danh mục.
  - `item_categories.parent_id`: **nullable** dù spec không ghi rõ — bắt buộc phải nullable để có danh mục gốc (không cha) trong cấu trúc cây cha-con.
  - `warehouses.manager_id`: **nullable** — thực tế kho có thể chưa gán quản lý ngay lúc tạo.
  - Các field mô tả/tự do (description, note, specifications, address, phone, contact_name, email liên hệ, website, reason, purpose, project_name, batch_number, image_url, item_type, location_name/area/shelf/drawer/box) đều **optional**; các field định danh/khóa ngoại cốt lõi và số lượng/ngày/trạng thái đều **required**.
  - `import_order_items.unit_price`: kiểu `Decimal(14, 2)` (nullable — không phải phiếu nhập nào cũng cần ghi đơn giá).
  - Tất cả PK dùng `String @id @default(uuid())` (UUID v4).
  - `storage_locations`: thêm unique composite `(warehouse_id, location_code)` — spec chỉ gợi ý đánh index `location_code`, nhưng để tránh trùng mã vị trí trong cùng 1 kho, ràng buộc unique theo cặp.
  - Enum `ReferenceType` dùng giá trị UPPER_SNAKE_CASE (`IMPORT_ORDER`, `EXPORT_ORDER`...) thay vì snake_case thường như liệt kê trong spec (`import_order`...) — theo convention enum Prisma/Postgres viết hoa.
- Ảnh hưởng tới: Backend (mọi service/controller dùng đúng các ràng buộc này), Web/Mobile (form tạo item bắt buộc chọn category; form tạo warehouse có thể bỏ trống quản lý).

## 2026-09-11 — Response helper, error mapping, JWT payload (B2-B4)
- Bối cảnh: viết middleware nền tảng (error handler, auth), cần chốt vài chi tiết implementation mà `02-BACKEND-SPEC.md` chỉ nói ở mức nguyên tắc chung.
- Quyết định:
  - Helper response dùng chung: `success(res, data, message, statusCode=200)` và `fail(res, message, statusCode=400, data=null)` trong `src/utils/response.js` — mọi controller PHẢI dùng 2 hàm này, không tự `res.json(...)` tay để tránh lệch format `{success,data,message}`.
  - Lỗi nghiệp vụ chủ động dùng `throw new ApiError(statusCode, message)` (từ `src/utils/ApiError.js`), không `return fail(...)` trực tiếp trong service — để error luôn đi qua 1 chỗ xử lý duy nhất (`errorHandler`).
  - Mapping lỗi Prisma → HTTP: `P2002` (unique constraint) → 409 "Dữ liệu đã tồn tại"; `P2003` (foreign key constraint) → 409 "Dữ liệu tham chiếu không hợp lệ hoặc đang được sử dụng"; `P2025` (record not found, ví dụ update/delete id không tồn tại) → 404. Lỗi `ZodError` → 400 kèm message ghép từ tất cả field lỗi. Lỗi khác → 500, log ra console, KHÔNG lộ message/stack thật ra response (tránh rò rỉ thông tin hệ thống).
  - JWT payload: `{ user_id, role }` (role = `role_name` dạng chuỗi, ví dụ `"admin"`, không phải `role_id`) — `authorize(...roles)` so sánh trực tiếp `req.user.role` với danh sách chuỗi role truyền vào. Secret đọc từ `process.env.JWT_SECRET`, hạn dùng từ `process.env.JWT_EXPIRES_IN` (mặc định `1d` nếu thiếu).
  - Đăng nhập với user có `status != ACTIVE` → 403 "Tài khoản đã bị khóa" (không phải 401) — phân biệt rõ với sai email/mật khẩu (401).
  - Response của `login`/`me` không bao giờ chứa `password_hash` (destructure loại bỏ trong `auth.service.js`).
- Ảnh hưởng tới: Backend (mọi route nghiệp vụ sau này dùng đúng pattern `ApiError` + `success/fail` + mapping lỗi này), Web/Mobile (biết chính xác status code/message để hiển thị lỗi, biết cấu trúc JWT không dùng được trực tiếp để lấy role_id).
