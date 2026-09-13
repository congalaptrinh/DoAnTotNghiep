# 09 — BUILD CHECKLIST: MOBILE APP (Flutter)

> Bối cảnh: `00-OVERVIEW.md`. Chức năng cần có: `04-MOBILE-SPEC.md`. API thật: `02-BACKEND-SPEC.md` + `07-DECISIONS-LOG.md` (cấu trúc response THẬT, bám đúng như Web đã dùng — không dùng lại giả định sai như từng xảy ra ở Web lúc đầu). Design tokens dùng chung với Web: xem `web/src/styles/tokens.css` và `07-DECISIONS-LOG.md` phần màu sắc đã chốt (gradient indigo #4F46E5 → tím #7C3AED, semantic đỏ #DC2626/vàng #F59E0B/xanh #16A34A).
>
> **QUYẾT ĐỊNH: không qua Figma, thiết kế UI trực tiếp bằng Flutter, dựa theo mô tả trong `04-MOBILE-SPEC.md` và phong cách đã chốt từ Web.** Ưu tiên tối giản, ít bước, nút bấm to dễ chạm — đối tượng dùng là nhân viên kho thao tác nhanh tại hiện trường.
>
> **Quy tắc làm việc:** giống hệt `06-BUILD-CHECKLIST.md`/`08-WEB-BUILD-CHECKLIST.md` — làm đúng thứ tự, tick `[x]` + ghi note sau mỗi mục, ghi quyết định phát sinh vào `07-DECISIONS-LOG.md`, dừng hỏi nếu cần đổi khác spec. Đang làm trên nhánh Git `feature/mobile-app` — mọi push dùng nhánh này, không push vào `main`.
>
> **Mức độ kiểm thử theo độ rủi ro** (bài học từ Web App): CRUD/màn hình đơn giản lặp lại pattern đã kiểm chứng → code review + gọi API thật kiểm tra nhanh. Logic phức tạp/rủi ro cao (luồng AI, transaction, RBAC) → kiểm tra kỹ, có bằng chứng cụ thể. Không cần Playwright (đó là công cụ web) — dùng Flutter widget test hoặc test thủ công có hướng dẫn cụ thể cho người dùng tự làm khi cần.

---

## Giai đoạn A — Nền tảng dự án

- [x] A1. Khởi tạo project Flutter trong thư mục `mobile/` (`flutter create .`), xác nhận chạy được trên emulator/thiết bị thật (hoặc Chrome nếu dùng Flutter Web để dễ demo không cần emulator). **Note:** `flutter create --org com.techstore.wms --project-name wms_mobile .`. Xác nhận bằng `flutter analyze` + `flutter test` + `flutter build web` (không dùng `flutter run` ở giai đoạn setup — xem quyết định trong `07-DECISIONS-LOG.md`); chạy giao diện thật để dành tới sau Giai đoạn C.
- [x] A2. Cài package cần thiết: `dio` (HTTP client), `flutter_secure_storage` (lưu JWT), state management (chọn 1: `riverpod` hoặc `provider`, ghi quyết định vào decisions log), `image_picker` hoặc `camera` (chụp ảnh AI), `go_router` (điều hướng). **Note:** chọn Riverpod + image_picker, lý do ghi trong decisions log.
- [x] A3. Thiết lập Design Tokens Flutter (`ThemeData` dùng chung: màu, font, bo góc) — khớp CHÍNH XÁC giá trị đã chốt ở Web (`web/src/styles/tokens.css`). Ghi vào decisions log. **Note:** `lib/utils/app_theme.dart`.
- [x] A4. Setup API client: base URL từ config/env, interceptor gắn JWT tự động, xử lý lỗi tập trung theo đúng format `{ success, data, message }` của Backend thật (giống `web/src/services/apiClient.ts` đã có — có thể tham khảo logic y hệt). **Note:** `lib/services/api_client.dart` + `secure_storage_service.dart` + `lib/utils/constants.dart`.
- [x] A5. Cấu trúc thư mục: `lib/{screens,widgets,services,models,providers,utils}`. Ghi convention vào decisions log. **Note:** đã tạo, convention ghi trong decisions log.

## Giai đoạn B — Auth & Phân quyền

- [x] B1. Màn Đăng nhập — gọi `POST /api/auth/login` thật, lưu JWT vào secure storage. **Note:** `lib/screens/auth/login_screen.dart`.
- [x] B2. Provider/Context lấy user hiện tại qua `GET /api/auth/me`, lưu role. **Note:** `lib/providers/auth_provider.dart` (Riverpod `AuthNotifier`), tự khôi phục phiên lúc mở app.
- [x] B3. Hệ thống phân quyền dùng chung (1 chỗ duy nhất, tương tự `config/permissions.ts` bên Web) — quyết định menu/nút nào hiện theo role. Vì Mobile chủ yếu dành cho `warehouse_staff`, nhưng vẫn hỗ trợ đăng nhập được các role khác (ẩn bớt tính năng theo đúng phân quyền thật). **Note:** `lib/utils/permissions.dart`, khớp `RESOURCE_WRITE_ACCESS` bên Web cho import_orders/export_orders/ai_detect.
- [x] B4. Tự động đăng xuất khi token hết hạn/401, quay về màn Đăng nhập. **Note:** `ApiClient.setUnauthorizedHandler` + `go_router` redirect (`lib/router.dart`).

**Bằng chứng RBAC (rủi ro cao, có test cụ thể):** `flutter test` — 25/25 pass, gồm `test/permissions_test.dart` (17 test logic role thuần) + `test/auth_integration_test.dart` (7 test gọi Backend thật với 4 tài khoản admin/manager/staff/viewer, verify đúng role + chặn sai mật khẩu/thiếu token bằng 401).

## Giai đoạn C — Trang chủ & Điều hướng

- [ ] C1. Bottom navigation bar 4 tab: Trang chủ / Tồn kho / Quét AI / Lịch sử.
- [ ] C2. Trang chủ: lời chào, vài số liệu tóm tắt dạng card lớn (tái sử dụng logic từ `useDashboardStats` bên Web nếu hợp lý), danh sách phiếu gần đây của chính người dùng đang đăng nhập.

## Giai đoạn D — Tồn kho & Vật tư (đọc + tạo phiếu nhanh)

- [ ] D1. Danh sách vật tư — tìm kiếm, mỗi item 1 card (tên, mã, tồn kho hiện tại), nối `GET /api/items` + `GET /api/inventory`.
- [ ] D2. Chi tiết vật tư — tồn kho theo từng kho/vị trí, 2 nút "Tạo phiếu nhập nhanh" / "Tạo phiếu xuất nhanh".
- [ ] D3. Form tạo phiếu nhập/xuất nhanh — tối giản: chọn kho (dropdown to), chọn vật tư (ô tìm kiếm), nhập số lượng (bàn phím số to), 1 nút xác nhận lớn. Nối `POST /api/import-orders` (+ confirm) / `POST /api/export-orders` (+ confirm) thật, xử lý đúng lỗi tồn kho không đủ.

## Giai đoạn E — Luồng chụp ảnh AI (phần quan trọng nhất, độ rủi ro cao)

- [ ] E1. Màn hình Camera — full-screen, nút chụp lớn ở giữa dưới, xin quyền camera đúng chuẩn Flutter (`permission_handler`).
- [ ] E2. Gửi ảnh chụp được lên `POST /api/ai/detect` thật, hiển thị loading rõ ràng trong lúc chờ.
- [ ] E3. Màn kết quả — ảnh có vẽ bounding box (theo tỉ lệ % thật từ kích thước ảnh trả về, tương tự cách Web đã làm ở F1), danh sách nhãn nhận diện dạng card vuốt ngang, mỗi card có ô sửa số lượng.
- [ ] E4. Bắt buộc map mỗi nhãn AI sang vật tư + vị trí thật (giống Web) vì mock AI không gắn `item_id`.
- [ ] E5. Nút "Xác nhận tạo phiếu nhập" — gọi `POST /api/import-orders/from-ai` thật, xác nhận tồn kho tăng đúng sau khi tạo.

**Test bắt buộc kỹ cho Giai đoạn E:** thử luồng đầy đủ từ chụp ảnh (hoặc chọn ảnh có sẵn nếu dùng Web/emulator không có camera thật) → nhận kết quả → sửa số lượng → xác nhận → verify tồn kho qua API.

## Giai đoạn F — Lịch sử

- [ ] F1. Danh sách các phiếu do người dùng tạo gần đây, mỗi dòng icon màu theo loại nghiệp vụ (đồng bộ màu với Web), trạng thái badge (DRAFT/CONFIRMED/CANCELLED — đúng 3 giá trị thật, không bịa thêm).

## Giai đoạn G — Kiểm thử & hoàn thiện

- [ ] G1. Test thủ công (có hướng dẫn cụ thể cho người dùng) luồng chính: đăng nhập → xem tồn kho → tạo phiếu nhanh → chụp ảnh AI → xác nhận → xem lịch sử.
- [ ] G2. Rà lại toàn bộ màu sắc/spacing khớp đúng token đã định nghĩa ở A3, nhất quán với Web.
- [ ] G3. Cập nhật `07-DECISIONS-LOG.md` lần cuối cho Mobile App.
- [ ] G4. Build thử bản release cơ bản (`flutter build apk` hoặc tương đương) xác nhận không lỗi.

---

**Khi nào coi là xong Mobile App:** toàn bộ checkbox đã tick, luồng chụp ảnh AI chạy được với Backend thật, người dùng tự test được bằng hướng dẫn cụ thể và xác nhận ổn. Lúc đó mới nên mở `05-AI-SERVICE-SPEC.md` cho giai đoạn AI Service thật.
