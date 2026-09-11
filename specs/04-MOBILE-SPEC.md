# 04 — MOBILE APP SPEC (Flutter / Dart)

> Bối cảnh dự án: `00-OVERVIEW.md`. API do Backend cung cấp: `02-BACKEND-SPEC.md`. Mobile App gọi **cùng bộ REST API** với Web App — không có API riêng.

## 1. Vai trò

Hỗ trợ nhân viên kho thao tác nhanh trên điện thoại khi làm việc trực tiếp tại kho: tra cứu, nhập/xuất nhanh, chụp ảnh cho AI nhận diện.

## 2. Danh sách màn hình / chức năng

- **Đăng nhập** — lưu JWT (secure storage), tự động refresh session.
- **Danh sách vật tư** — xem, tìm kiếm theo tên/mã vật tư.
- **Xem tồn kho theo vật tư** — số lượng tại từng kho/vị trí.
- **Xem vị trí lưu trữ** — chi tiết khu vực/kệ/ngăn/hộp.
- **Tạo phiếu nhập kho nhanh** — chọn kho, vật tư, số lượng, hoặc dùng ảnh (xem mục 3).
- **Tạo phiếu xuất kho nhanh** — chọn kho, vật tư, vị trí, số lượng, mục đích/dự án.
- **Chụp ảnh linh kiện** — dùng camera hoặc chọn ảnh từ thư viện, gửi lên hệ thống.
- **Xem kết quả AI nhận diện** — hiển thị ảnh có bounding box, danh sách lớp + số lượng + độ tin cậy.
- **Xác nhận/chỉnh sửa kết quả AI** — sửa số lượng/loại linh kiện trước khi tạo phiếu nhập.
- **Lịch sử thao tác cơ bản** — danh sách các phiếu do chính người dùng tạo gần đây.

## 3. Luồng "Nhập kho bằng AI" trên Mobile

1. Từ màn hình chính, chọn "Chụp ảnh nhập kho" → mở camera hoặc chọn ảnh.
2. Gửi ảnh lên `POST /api/ai/detect` (qua Backend) → nhận kết quả.
3. Hiển thị ảnh đã đánh dấu bounding box + danh sách linh kiện nhận diện được (loại, số lượng, độ tin cậy).
4. Người dùng xác nhận hoặc sửa từng dòng → chọn kho/vị trí nhập → gửi tạo phiếu nhập (`POST /api/import-orders/from-ai`).

## 4. Yêu cầu UI/UX

- Giao diện tối giản, ưu tiên thao tác nhanh bằng ngón tay, ít bước nhất có thể.
- Hỗ trợ hoạt động cơ bản khi mạng chậm (loading state rõ ràng, retry khi lỗi mạng).
- Xin quyền camera/thư viện ảnh đúng chuẩn Flutter (permission_handler hoặc tương đương).
- Responsive cho nhiều kích thước màn hình điện thoại.

## 5. Gợi ý kỹ thuật (không bắt buộc cứng)

- State management: Riverpod hoặc Provider hoặc Bloc — chọn 1 và dùng nhất quán toàn app.
- HTTP client: `dio` (hỗ trợ interceptor để gắn JWT tự động, multipart upload ảnh dễ dàng).
- Lưu token: `flutter_secure_storage`.
- Camera/ảnh: `image_picker` hoặc `camera` package.

## 6. Kiểm thử

- Test luồng đăng nhập, lưu/khôi phục session.
- Test tạo phiếu nhập/xuất nhanh — cả thành công và lỗi (tồn kho không đủ khi xuất).
- Test luồng chụp ảnh → gửi AI → xác nhận → tạo phiếu nhập, bao gồm trường hợp AI trả kết quả rỗng/lỗi.
