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

## Ví dụ (xoá dòng này khi bắt đầu ghi thật)

## 2026-07-12 — Cấu trúc thư mục Backend
- Bối cảnh: spec không quy định cụ thể cấu trúc folder.
- Quyết định: `src/routes`, `src/controllers`, `src/services`, `src/middlewares`, `src/prisma` (schema + client).
- Ảnh hưởng tới: Backend (các phiên code sau cần theo đúng cấu trúc này).

---

*(Bắt đầu ghi các quyết định thật từ đây)*

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
