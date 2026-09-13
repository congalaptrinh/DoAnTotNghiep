# 04 — MOBILE APP SPEC (Flutter / Dart)

> Bối cảnh dự án: `00-OVERVIEW.md`. API do Backend cung cấp: `02-BACKEND-SPEC.md`. Mobile App gọi **cùng bộ REST API** với Web App — không có API riêng.

## 1. Vai trò

Hỗ trợ nhân viên kho thao tác nhanh trên điện thoại khi làm việc trực tiếp tại kho: tra cứu, nhập/xuất nhanh, chụp ảnh cho AI nhận diện.

## 2. Danh sách màn hình / chức năng

- **Đăng nhập** — lưu JWT (secure storage), tự động refresh session.
- **Danh sách vật tư** — xem, tìm kiếm theo tên/mã vật tư.
- **Xem tồn kho theo vật tư** — số lượng tại từng kho/vị trí.
- **Xem vị trí lưu trữ** — chi tiết khu vực/kệ/ngăn/hộp.
- **Tạo phiếu nhập/xuất kho nhanh** (từ chi tiết 1 vật tư cụ thể) — chọn kho, vị trí, số lượng cho ĐÚNG vật tư đang xem, 1 dòng/phiếu, tối giản tối đa cho thao tác tại chỗ.
- **Nhập kho** (mục riêng ở menu chính, KHÔNG xuất phát từ 1 vật tư cụ thể) — 2 lựa chọn:
  - **Nhập kho thủ công** — chọn 1 kho, thêm được NHIỀU DÒNG vật tư (không giới hạn 1 dòng/phiếu), mỗi dòng chọn vật tư + vị trí + số lượng riêng, thêm/xoá được từng dòng — cùng tinh thần với form nhập kho đầy đủ bên Web.
  - **Quét ảnh AI** — xem mục 3.
  > **Quyết định 2026-09-13 (thay đổi phạm vi):** ban đầu Mobile chỉ có "phiếu nhanh" 1 dòng để tối giản; sau khi người dùng tự test thấy không đủ dùng khi cần nhận nhiều vật tư 1 lần, đã bổ sung "Nhập kho thủ công" đa dòng. "Phiếu nhanh" 1 dòng (từ chi tiết vật tư) vẫn giữ nguyên cho thao tác tức thời. Xem `07-DECISIONS-LOG.md`.
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
- **Màu sắc phải ĐỦ ĐẬM, tương phản rõ ràng, dễ đọc thật sự** — dùng đúng token đã chốt (`brandFrom`/`brandTo`/`danger`/`warning`/`success`/`info`/`accent`), áp dụng nhất quán cho AppBar/nút/icon trên toàn app, không chỉ điểm xuyết. Chữ phụ chú không dùng màu đen nhạt (`black45`/`black26` kiểu Flutter mặc định) mà dùng đúng thang xám Web đang dùng (tương đương Tailwind gray-500/700/900). Khoảng cách/padding giữa các phần tử dùng thống nhất 1 bộ hằng số chuẩn cho toàn app, không tự chọn số khác nhau ở từng màn.

## 5. Gợi ý kỹ thuật (không bắt buộc cứng)

- State management: Riverpod hoặc Provider hoặc Bloc — chọn 1 và dùng nhất quán toàn app.
- HTTP client: `dio` (hỗ trợ interceptor để gắn JWT tự động, multipart upload ảnh dễ dàng).
- Lưu token: `flutter_secure_storage`.
- Camera/ảnh: `image_picker` hoặc `camera` package.

## 6. Kiểm thử

- Test luồng đăng nhập, lưu/khôi phục session.
- Test tạo phiếu nhập/xuất nhanh — cả thành công và lỗi (tồn kho không đủ khi xuất).
- Test luồng chụp ảnh → gửi AI → xác nhận → tạo phiếu nhập, bao gồm trường hợp AI trả kết quả rỗng/lỗi.
