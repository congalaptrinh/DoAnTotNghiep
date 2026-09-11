# 03 — WEB APP SPEC (ReactJS)

> Bối cảnh dự án: `00-OVERVIEW.md`. API do Backend cung cấp: `02-BACKEND-SPEC.md`. Schema tham khảo khi hiển thị dữ liệu: `01-DATABASE-SCHEMA.md`.

## 1. Vai trò

Giao diện chính dành cho Admin, Quản lý kho, Nhân viên kho, Người xem báo cáo khi thao tác trên máy tính. Gọi REST API của Backend (dùng chung với Mobile App).

## 2. Danh sách màn hình / chức năng

- **Đăng nhập** — form login, lưu JWT, redirect theo role.
- **Dashboard tổng quan** — số liệu tổng hợp: tổng số vật tư, cảnh báo tồn kho thấp (so với `min_stock`), số phiếu chờ xử lý gần đây.
- **Quản lý người dùng** (Admin) — CRUD users, gán role.
- **Quản lý danh mục vật tư** — CRUD `item_categories` (hỗ trợ cây cha-con), CRUD `items`.
- **Quản lý kho & vị trí lưu trữ** — CRUD `warehouses`, CRUD `storage_locations` theo từng kho.
- **Quản lý tồn kho** — bảng tồn kho, filter theo kho/vị trí/vật tư, tìm kiếm theo `item_code`/`item_name`.
- **Quản lý nhà cung cấp** — CRUD `suppliers`.
- **Quản lý phiếu nhập kho** — danh sách, tạo phiếu (chọn supplier, kho, vật tư, số lượng), chi tiết, xác nhận. Có tuỳ chọn "Nhập kho bằng AI" (xem mục 4).
- **Quản lý phiếu xuất kho** — danh sách, tạo phiếu (kho, vật tư, vị trí, số lượng, mục đích/dự án), chi tiết, xác nhận; hiển thị rõ khi tồn kho không đủ.
- **Quản lý chuyển kho** — danh sách, tạo phiếu (vật tư, kho/vị trí nguồn & đích, số lượng), chi tiết, xác nhận.
- **Quản lý thu hồi** — danh sách, tạo phiếu, chi tiết, xác nhận.
- **Quản lý kiểm kê** — tạo phiên kiểm kê theo kho, nhập số lượng thực tế cho từng vật tư, xem chênh lệch, xác nhận điều chỉnh.
- **Quản lý thanh lý** — danh sách, tạo phiếu, chi tiết, xác nhận.
- **Lịch sử biến động kho** — bảng `stock_movements`, filter theo vật tư/kho/loại nghiệp vụ/thời gian.

## 3. Yêu cầu UI/UX

- Layout rõ ràng, phù hợp người dùng văn phòng/quản lý: sidebar điều hướng theo module, bảng dữ liệu có filter/sort/pagination, form có validate phía client trước khi gọi API.
- Phân quyền UI: ẩn/khoá các mục menu và action mà role hiện tại không được phép (dù Backend vẫn là nơi enforce quyền thật sự).
- Thông báo lỗi rõ ràng khi API trả lỗi (ví dụ tồn kho không đủ khi xuất kho).
- Không tự bịa thêm trường dữ liệu ngoài schema — nếu cần trường mới, hỏi lại trước khi thêm.

## 4. Luồng "Nhập kho bằng AI" trên Web

1. Tại màn tạo phiếu nhập kho, có nút "Nhận diện bằng AI" → mở modal upload ảnh.
2. Upload ảnh → gọi `POST /api/ai/detect` → hiển thị kết quả: ảnh có bounding box, danh sách lớp linh kiện + số lượng + độ tin cậy.
3. Người dùng chỉnh sửa số lượng/loại linh kiện nếu AI nhận sai, sau đó bấm "Xác nhận" → điền tự động vào form phiếu nhập (item, quantity) → người dùng chọn kho/vị trí còn thiếu → submit tạo phiếu nhập như bình thường.

## 5. Gợi ý kỹ thuật (không bắt buộc cứng, nhưng nên theo)

- State/data fetching: React Query (hoặc SWR) để quản lý cache API.
- Form: React Hook Form + validate (zod/yup).
- Routing: React Router, route guard theo role.
- UI kit: tuỳ chọn (MUI/AntD/Tailwind...) miễn nhất quán toàn app.

## 6. Kiểm thử

- Test luồng đăng nhập/phân quyền ẩn hiện menu.
- Test tạo phiếu nhập/xuất/chuyển/thu hồi/kiểm kê/thanh lý — cả trường hợp thành công và trường hợp lỗi (tồn kho không đủ).
- Test luồng nhập kho bằng AI end-to-end (mock API AI nếu service chưa sẵn sàng).
