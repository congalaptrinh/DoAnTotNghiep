QUAN TRỌNG — ĐỌC KỸ TRƯỚC KHI LÀM: Tôi cần bạn thiết kế các MÀN HÌNH ỨNG DỤNG THẬT, đầy đủ nội dung, giống hệt những gì người dùng sẽ thấy khi mở app thật. TUYỆT ĐỐI KHÔNG tạo 1 trang tài liệu/style-guide/showcase liệt kê bảng màu, bảng component mẫu, hay bất kỳ dạng "trang giới thiệu design system" nào — tôi không cần trang giới thiệu, tôi cần các trang ứng dụng có sidebar, có dữ liệu mẫu, có layout hoàn chỉnh, sẵn sàng bàn giao cho lập trình viên code theo.

Sản phẩm: hệ thống quản lý kho linh kiện điện tử & thiết bị kỹ thuật, có tích hợp AI nhận diện vật tư qua ảnh chụp. Đối tượng dùng: nhân viên văn phòng/quản lý kho — cần rõ ràng, chuyên nghiệp.

=== PHONG CÁCH THỊ GIÁC (áp dụng nhất quán cho mọi màn hình bên dưới, không lệch màn nào) ===
- SaaS dashboard hiện đại, có điểm nhấn qua gradient (không phẳng nhạt).
- Font sans-serif hiện đại (Inter hoặc tương đương).
- Bo góc mềm: 16px card lớn/hero, 10-12px card nhỏ, 8px input/button, 6px badge.
- Đổ bóng nhẹ cho card nổi trên nền.
- Màu chủ đạo: gradient indigo→tím (#4F46E5 → #7C3AED) cho sidebar, nút hành động chính, hero banner.
- Màu ngữ nghĩa: đỏ #DC2626 (cảnh báo/thiếu hàng), vàng cam #F59E0B (sắp hết/chờ xử lý), xanh lá #16A34A (ổn định/thành công).
- Nền chính #F8F9FB, card nền trắng, border #E5E7EB.

=== BỐ CỤC CHUNG CHO MỌI MÀN (trừ Đăng nhập) ===
Sidebar trái cố định ~220px, nền gradient indigo→tím, chữ trắng, mục đang chọn có nền trắng mờ (overlay 15-18%) nổi bật rõ. Nội dung sidebar theo đúng thứ tự: logo + tên hệ thống, Dashboard, Tồn kho, Danh mục vật tư, Kho & vị trí, nhóm "NGHIỆP VỤ KHO" (Nhập kho, Xuất kho, Chuyển kho, Thu hồi, Kiểm kê, Thanh lý — thụt lề, chữ nhỏ hơn), Nhà cung cấp, Lịch sử biến động, Người dùng, Vai trò. Dưới cùng sidebar: avatar + tên + vai trò người dùng đang đăng nhập. Content bên phải: hero banner gradient mỏng cho Dashboard, breadcrumb đơn giản cho các trang khác.

=== ĐĂNG NHẬP — CHỈ 1 MÀN DUY NHẤT ===
Không có nhiều màn đăng nhập theo vai trò. Chỉ 1 form đăng nhập chung (email + mật khẩu) cho mọi tài khoản — hệ thống tự đọc vai trò sau khi đăng nhập thành công, không có "cổng vào" riêng theo vai trò. Bố cục chia đôi màn hình: trái là panel gradient (~55%) có logo, tiêu đề sản phẩm, mô tả ngắn, 3 điểm nổi bật kèm icon check, vài hình tròn mờ trang trí; phải là form đăng nhập gọn trên nền trắng.

=== DANH SÁCH ĐẦY ĐỦ CÁC MÀN CẦN THIẾT KẾ — MỖI MÀN LÀ 1 FRAME RIÊNG, CÓ SIDEBAR + NỘI DUNG THẬT VỚI DỮ LIỆU MẪU CỤ THỂ (không để trống, không dùng placeholder mờ) ===

1. Đăng nhập.
2. Dashboard — hero banner (lời chào + ngày + tóm tắt), 4 stat card đè lên hero (tổng vật tư=indigo, sắp hết hàng=đỏ, phiếu chờ duyệt=vàng, số kho=xanh lá), biểu đồ cột Nhập/Xuất theo tuần, feed hoạt động gần đây.
3. Tồn kho — bảng chính có ít nhất 5 dòng dữ liệu mẫu thật (mã, tên, kho, vị trí, tồn, khả dụng, badge trạng thái), thanh tìm kiếm + 2 dropdown lọc, nút "Tạo phiếu nhập".
4. Danh mục vật tư — bảng cây cha-con có dữ liệu mẫu.
5. Vật tư (Items) — bảng có ảnh thumbnail, mã, tên, loại, đơn vị, ngưỡng min/max, trạng thái.
6. Kho (Warehouses) — danh sách kho có dữ liệu mẫu (địa chỉ, người quản lý, số vị trí).
7. Vị trí lưu trữ — bảng theo từng kho (khu vực/kệ/ngăn/hộp) có dữ liệu mẫu.
8. Nhà cung cấp — bảng danh sách liên hệ có dữ liệu mẫu.
9. Nhập kho — danh sách phiếu có dữ liệu mẫu + màn tạo phiếu có luồng AI: progress stepper 3 bước, ảnh có bounding box màu quanh linh kiện, badge tổng hợp loại×số lượng, bảng chỉnh sửa số lượng/vị trí, 2 nút cuối.
10. Xuất kho — danh sách phiếu (badge trạng thái) + form tạo phiếu, có ví dụ cảnh báo đỏ khi tồn kho không đủ.
11. Chuyển kho — danh sách phiếu + form 2 cột song song (nguồn — đích) nối bằng icon mũi tên.
12. Thu hồi — danh sách phiếu + form tạo phiếu.
13. Kiểm kê — danh sách phiên + bảng nhập số liệu (Hệ thống — Thực tế — Chênh lệch, âm đỏ/dương xanh) có ví dụ số liệu thật.
14. Thanh lý — danh sách phiếu + form tạo phiếu.
15. Lịch sử biến động kho — bảng log có ít nhất 6 dòng dữ liệu mẫu đủ loại nghiệp vụ, bộ lọc, icon+màu riêng theo từng loại (nhập=xanh lá, xuất=đỏ, chuyển=xanh dương, thu hồi=tím, kiểm kê=vàng, thanh lý=xám).
16. Người dùng — bảng tài khoản có dữ liệu mẫu (tên, email, vai trò, trạng thái) + form thêm/sửa.
17. Vai trò — danh sách 4 vai trò kèm mô tả quyền.

=== PHÂN QUYỀN THEO VAI TRÒ (thể hiện qua NỘI DUNG SIDEBAR khác nhau trên các bản sao của cùng 1 màn, không phải màn đăng nhập riêng) ===
Tạo thêm 3 frame biến thể của Dashboard (hoặc 1 màn tiêu biểu khác), mỗi frame gắn nhãn rõ vai trò, thể hiện sidebar bị rút gọn tương ứng:
- Quản lý kho: ẩn "Người dùng"/"Vai trò" khỏi sidebar.
- Nhân viên kho: sidebar chỉ còn Dashboard, Tồn kho, nhóm Nghiệp vụ kho (không có Kiểm kê, Thanh lý), Kho & vị trí — ẩn Danh mục vật tư, Nhà cung cấp, Người dùng, Vai trò, Lịch sử biến động.
- Người xem báo cáo: sidebar chỉ còn Dashboard, Tồn kho, Lịch sử biến động.
(Frame gốc ở mục Danh sách màn hình phía trên mặc định là góc nhìn Admin — đầy đủ nhất.)

Tất cả frame đặt tên rõ ràng theo tên màn hình, nhóm trong cùng 1 file Figma theo section "Screens". KHÔNG tạo thêm bất kỳ frame "documentation/style guide" nào ngoài các frame màn hình ứng dụng đã liệt kê ở trên.