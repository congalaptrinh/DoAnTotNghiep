# 01 — DATABASE SCHEMA (PostgreSQL qua Prisma)

> File này là nguồn sự thật (source of truth) cho toàn bộ schema DB. Backend, và mọi chỗ khác cần biết cấu trúc dữ liệu, phải tham chiếu file này. Xem bối cảnh dự án ở `00-OVERVIEW.md`.

Khi viết `schema.prisma`: dùng đúng kiểu dữ liệu Prisma (String, Int, Decimal, DateTime, Boolean, enum...), khóa chính `@id @default(uuid())` hoặc serial tùy chọn, khóa ngoại `@relation`, và index cho các cột tra cứu thường xuyên (`item_code`, `email`, `location_code`, các cột FK...).

## 1. Người dùng & phân quyền

**roles**
- role_id (PK)
- role_name
- description

**users**
- user_id (PK)
- full_name
- email (unique)
- password_hash
- phone
- role_id (FK → roles)
- status
- created_at, updated_at

## 2. Danh mục vật tư

**item_categories**
- category_id (PK)
- category_name
- parent_id (self FK, hỗ trợ danh mục cha-con)
- description

**items**
- item_id (PK)
- item_code (unique)
- item_name
- item_type
- category_id (FK → item_categories)
- unit
- description
- specifications
- min_stock
- max_stock
- image_url
- status
- created_at, updated_at

## 3. Kho & vị trí lưu trữ

**warehouses**
- warehouse_id (PK)
- warehouse_name
- address
- manager_id (FK → users)
- description
- status
- created_at, updated_at

**storage_locations**
- location_id (PK)
- warehouse_id (FK → warehouses)
- location_code
- location_name
- area, shelf, drawer, box
- description
- status
- created_at, updated_at

## 4. Tồn kho

**inventory**
- inventory_id (PK)
- item_id (FK → items)
- warehouse_id (FK → warehouses)
- location_id (FK → storage_locations)
- quantity
- reserved_quantity
- available_quantity (= quantity − reserved_quantity)
- updated_at

> Ràng buộc unique gợi ý: `(item_id, warehouse_id, location_id)` — mỗi vật tư chỉ có 1 dòng tồn kho tại 1 vị trí cụ thể.

## 5. Nhà cung cấp

**suppliers**
- supplier_id (PK)
- supplier_name
- contact_name, phone, email, address, website
- description
- status
- created_at, updated_at

## 6. Nhập kho

**import_orders**
- import_id (PK)
- import_code (unique)
- supplier_id (FK → suppliers, nullable)
- warehouse_id (FK → warehouses)
- created_by (FK → users)
- import_date
- status
- note
- created_at, updated_at

**import_order_items**
- import_item_id (PK)
- import_id (FK → import_orders)
- item_id (FK → items)
- location_id (FK → storage_locations)
- quantity
- unit_price
- batch_number
- note

## 7. Xuất kho

**export_orders**
- export_id (PK)
- export_code (unique)
- warehouse_id (FK → warehouses)
- requested_by (FK → users)
- approved_by (FK → users, nullable)
- export_date
- purpose
- project_name
- status
- note
- created_at, updated_at

**export_order_items**
- export_item_id (PK)
- export_id (FK → export_orders)
- item_id (FK → items)
- location_id (FK → storage_locations)
- quantity
- note

## 8. Chuyển kho

**transfer_orders**
- transfer_id (PK)
- transfer_code (unique)
- from_warehouse_id (FK → warehouses)
- to_warehouse_id (FK → warehouses)
- created_by (FK → users)
- transfer_date
- status
- note
- created_at, updated_at

**transfer_order_items**
- transfer_item_id (PK)
- transfer_id (FK → transfer_orders)
- item_id (FK → items)
- from_location_id (FK → storage_locations)
- to_location_id (FK → storage_locations)
- quantity
- note

## 9. Thu hồi (bổ sung theo pattern nhập kho)

**recovery_orders**
- recovery_id (PK)
- recovery_code (unique)
- warehouse_id (FK → warehouses)
- created_by (FK → users)
- recovery_date
- reason
- status
- note
- created_at, updated_at

**recovery_order_items**
- recovery_item_id (PK)
- recovery_id (FK → recovery_orders)
- item_id (FK → items)
- location_id (FK → storage_locations)
- quantity
- note

## 10. Kiểm kê (bổ sung theo pattern nhập kho)

**stocktake_sessions**
- stocktake_id (PK)
- stocktake_code (unique)
- warehouse_id (FK → warehouses)
- created_by (FK → users)
- stocktake_date
- status
- note
- created_at, updated_at

**stocktake_session_items**
- stocktake_item_id (PK)
- stocktake_id (FK → stocktake_sessions)
- item_id (FK → items)
- location_id (FK → storage_locations)
- system_quantity (số lượng theo hệ thống tại thời điểm kiểm kê)
- actual_quantity (số lượng thực tế nhân viên nhập)
- difference (= actual_quantity − system_quantity)
- note

## 11. Thanh lý (bổ sung theo pattern nhập kho)

**liquidation_orders**
- liquidation_id (PK)
- liquidation_code (unique)
- warehouse_id (FK → warehouses)
- created_by (FK → users)
- approved_by (FK → users, nullable)
- liquidation_date
- reason
- status
- note
- created_at, updated_at

**liquidation_order_items**
- liquidation_item_id (PK)
- liquidation_id (FK → liquidation_orders)
- item_id (FK → items)
- location_id (FK → storage_locations)
- quantity
- note

> Nếu thiết bị được quản lý theo serial/từng chiếc, cân nhắc thêm bảng `equipment_units` (item_id, serial_number, status: IN_STOCK/LIQUIDATED/...) và liên kết vào `liquidation_order_items` qua `equipment_unit_id` (nullable, chỉ dùng khi vật tư là loại quản lý theo serial).

## 12. Lịch sử biến động kho (bảng nhật ký trung tâm)

**stock_movements**
- movement_id (PK)
- item_id (FK → items)
- warehouse_id (FK → warehouses)
- location_id (FK → storage_locations)
- movement_type (enum: `IMPORT`, `EXPORT`, `TRANSFER_IN`, `TRANSFER_OUT`, `RECOVERY`, `ADJUSTMENT_STOCKTAKE`, `LIQUIDATION`)
- quantity
- reference_type (`import_order` / `export_order` / `transfer_order` / `recovery_order` / `stocktake_session` / `liquidation_order`)
- reference_id
- performed_by (FK → users)
- movement_date
- note

**Quy tắc bắt buộc:** mọi thao tác làm thay đổi `inventory.quantity` phải ghi 1 (hoặc nhiều, với chuyển kho) dòng tương ứng vào `stock_movements` trong cùng transaction.

## 13. Danh sách bảng triển khai (đầy đủ)

`roles`, `users`, `item_categories`, `items`, `warehouses`, `storage_locations`, `inventory`, `suppliers`, `import_orders`, `import_order_items`, `export_orders`, `export_order_items`, `transfer_orders`, `transfer_order_items`, `recovery_orders`, `recovery_order_items`, `stocktake_sessions`, `stocktake_session_items`, `liquidation_orders`, `liquidation_order_items`, `stock_movements`, (tùy chọn) `equipment_units`.

## 14. Ghi chú công nghệ

Backend dùng **Prisma ORM** kết nối PostgreSQL. Mọi migration phải qua Prisma Migrate (`prisma migrate dev` / `prisma migrate deploy`), không chỉnh tay DB production.
