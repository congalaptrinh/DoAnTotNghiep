# 02 — BACKEND SPEC (NodeJS + ExpressJS + Prisma + PostgreSQL)

> Bối cảnh dự án: `00-OVERVIEW.md`. Schema DB đầy đủ: `01-DATABASE-SCHEMA.md`. File này chỉ tập trung vào Backend — API, nghiệp vụ, quy tắc transaction.

## 1. Vai trò của Backend

Trung tâm xử lý nghiệp vụ, cung cấp REST API dùng chung cho Web App và Mobile App, kết nối PostgreSQL qua Prisma, và gọi sang AI Service khi cần nhận diện ảnh linh kiện.

## 2. Setup

- NodeJS + ExpressJS.
- Prisma ORM, schema theo `01-DATABASE-SCHEMA.md`.
- JWT cho xác thực, bcrypt cho hash mật khẩu.
- Middleware RBAC kiểm tra role (`admin`, `warehouse_manager`, `warehouse_staff`, `report_viewer`) trên từng route.
- Response format nhất quán: `{ success: boolean, data: any, message?: string }`.
- Validate input ở tầng API (không chỉ tin client) — khuyến nghị dùng `zod` hoặc `joi`.

## 3. Nhóm API cần xây dựng

### 3.1. Auth
- `POST /api/auth/register` (tùy — thường Admin tạo user, không cho tự đăng ký)
- `POST /api/auth/login` → trả JWT
- `GET /api/auth/me`

### 3.2. Người dùng & phân quyền
- CRUD `/api/users` (chỉ Admin)
- CRUD `/api/roles` (chỉ Admin)

### 3.3. Danh mục
- CRUD `/api/item-categories`
- CRUD `/api/items`
- CRUD `/api/warehouses`
- CRUD `/api/storage-locations`
- CRUD `/api/suppliers`

### 3.4. Tồn kho
- `GET /api/inventory` — filter theo item_id, warehouse_id, location_id
- `GET /api/inventory/:itemId` — tồn kho chi tiết 1 vật tư theo từng vị trí

### 3.5. Nghiệp vụ kho (mỗi nghiệp vụ: tạo phiếu, xem danh sách, xem chi tiết, xác nhận/duyệt)
- `/api/import-orders` (+ `/api/import-orders/:id/confirm`)
- `/api/export-orders` (+ `/api/export-orders/:id/confirm`)
- `/api/transfer-orders` (+ `/api/transfer-orders/:id/confirm`)
- `/api/recovery-orders` (+ `/api/recovery-orders/:id/confirm`)
- `/api/stocktake-sessions` (+ nhập số lượng thực tế, + `/api/stocktake-sessions/:id/confirm`)
- `/api/liquidation-orders` (+ `/api/liquidation-orders/:id/confirm`)

### 3.6. Lịch sử
- `GET /api/stock-movements` — filter theo item/kho/vị trí/loại nghiệp vụ/khoảng thời gian

### 3.7. Tích hợp AI
- `POST /api/ai/detect` — nhận ảnh từ Web/Mobile (multipart/form-data) → forward sang AI Service `/detect` → trả kết quả về client (không tự ghi tồn kho ở bước này)
- `POST /api/import-orders/from-ai` — nhận kết quả AI đã được người dùng xác nhận/chỉnh sửa → tạo phiếu nhập kho như flow thường (xem `05-AI-SERVICE-SPEC.md` mục giao tiếp)

## 4. Quy trình nghiệp vụ chi tiết (bắt buộc transaction)

### 4.1. Nhập kho
1. Tạo `import_orders` (status: DRAFT) + `import_order_items`.
2. Khi xác nhận (`/confirm`): trong 1 transaction Prisma —
   - Với mỗi `import_order_item`: upsert `inventory` (cộng `quantity`), insert `stock_movements` (movement_type=`IMPORT`, reference_type=`import_order`).
   - Cập nhật `import_orders.status = CONFIRMED`.

**Nhập kho bằng AI:** client gọi `/api/ai/detect` → nhận kết quả → người dùng xác nhận/sửa trên UI → gọi `/api/import-orders/from-ai` với dữ liệu đã xác nhận → tạo `import_orders` + `import_order_items` rồi confirm như flow thường (có thể gộp tạo + confirm làm 1 bước).

### 4.2. Xuất kho
1. Tạo `export_orders` (status: DRAFT) + `export_order_items`.
2. Khi xác nhận: kiểm tra `inventory.available_quantity` đủ cho từng dòng — nếu không đủ, trả lỗi 400 rõ ràng, không tạo transaction thay đổi dữ liệu.
3. Nếu đủ, trong 1 transaction: trừ `inventory.quantity`, insert `stock_movements` (`EXPORT`), cập nhật `export_orders.status = CONFIRMED`.

### 4.3. Chuyển kho
1. Tạo `transfer_orders` + `transfer_order_items`.
2. Khi xác nhận: kiểm tra số lượng tại vị trí nguồn đủ.
3. Trong 1 transaction: trừ `inventory` tại nguồn, cộng `inventory` tại đích (upsert nếu vị trí đích chưa có dòng tồn kho), insert 2 dòng `stock_movements` (`TRANSFER_OUT` tại nguồn, `TRANSFER_IN` tại đích) cho mỗi item, cập nhật status.

### 4.4. Thu hồi
1. Tạo `recovery_orders` + `recovery_order_items`.
2. Khi xác nhận: trong 1 transaction cộng `inventory`, insert `stock_movements` (`RECOVERY`).

### 4.5. Kiểm kê
1. Tạo `stocktake_sessions` cho 1 kho → hệ thống snapshot `system_quantity` từ `inventory` hiện tại vào `stocktake_session_items`.
2. Nhân viên nhập `actual_quantity` cho từng dòng → tính `difference`.
3. Khi xác nhận: trong 1 transaction, với mỗi dòng có `difference != 0`, cập nhật `inventory.quantity = actual_quantity`, insert `stock_movements` (`ADJUSTMENT_STOCKTAKE`, quantity = difference).

### 4.6. Thanh lý
1. Tạo `liquidation_orders` + `liquidation_order_items`.
2. Khi xác nhận: kiểm tra tồn kho đủ, trong 1 transaction trừ `inventory`, insert `stock_movements` (`LIQUIDATION`); nếu vật tư quản lý theo serial, cập nhật `equipment_units.status`.

## 5. Quy tắc bắt buộc

- Mọi bước "confirm" ở trên **phải** dùng `prisma.$transaction([...])` hoặc interactive transaction — không tách thành nhiều lệnh `await prisma.x.update()` rời rạc ngoài transaction.
- Không có nghiệp vụ nào được thay đổi `inventory` mà không ghi `stock_movements` tương ứng trong cùng transaction.
- Toàn bộ endpoint nghiệp vụ (import/export/transfer/recovery/stocktake/liquidation) áp dụng middleware kiểm tra role phù hợp (theo mục 6 của `00-OVERVIEW.md`).
- Đặt tên route, tên bảng, tên cột đúng snake_case/camelCase nhất quán với `01-DATABASE-SCHEMA.md`.

## 6. Kiểm thử Backend (tối thiểu)

- Unit/integration test cho từng luồng ở mục 4 (đặc biệt test case tồn kho không đủ khi xuất/chuyển/thanh lý).
- Test middleware RBAC chặn đúng role không được phép.
- Test transaction rollback khi có lỗi giữa chừng (ví dụ 1 trong nhiều item của phiếu bị thiếu tồn kho).
- Postman collection cho toàn bộ API, dùng để test thủ công và làm tài liệu cho FE/Mobile team.
