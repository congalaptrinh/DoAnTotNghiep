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

- [x] C1. Bottom navigation bar 4 tab: Trang chủ / Tồn kho / Quét AI / Lịch sử. **Note:** `lib/screens/home/home_shell.dart` (IndexedStack, không dùng route lồng go_router — đơn giản hơn vì không cần deep-link riêng cho từng tab). Quét AI/Lịch sử là placeholder "Sắp ra mắt" (Giai đoạn E/F chưa làm).
- [x] C2. Trang chủ: lời chào, vài số liệu tóm tắt dạng card lớn (tái sử dụng logic từ `useDashboardStats` bên Web nếu hợp lý), danh sách phiếu gần đây của chính người dùng đang đăng nhập. **Note:** `lib/screens/home/home_screen.dart` + `lib/providers/dashboard_provider.dart` — gộp `GET /items`+`/inventory`+`/import-orders`+`/export-orders` (không có endpoint tổng hợp riêng, giống Web). "Phiếu gần đây của tôi" là tính năng mới không có bên Web (Web chỉ có stock-movements chung), lọc client-side theo `created_by`/`requested_by` == user hiện tại.

## Giai đoạn D — Tồn kho & Vật tư (đọc + tạo phiếu nhanh)

- [x] D1. Danh sách vật tư — tìm kiếm, mỗi item 1 card (tên, mã, tồn kho hiện tại), nối `GET /api/items` + `GET /api/inventory`. **Note:** `lib/screens/inventory/inventory_list_screen.dart`, debounce 400ms.
- [x] D2. Chi tiết vật tư — tồn kho theo từng kho/vị trí, 2 nút "Tạo phiếu nhập nhanh" / "Tạo phiếu xuất nhanh". **Note:** `lib/screens/inventory/item_detail_screen.dart`, dùng endpoint thật `GET /api/inventory/:itemId`; 2 nút ẩn theo đúng RBAC B3 (`canWrite`).
- [x] D3. Form tạo phiếu nhập/xuất nhanh — tối giản: chọn kho (dropdown to), chọn vật tư (ô tìm kiếm), nhập số lượng (bàn phím số to), 1 nút xác nhận lớn. Nối `POST /api/import-orders` (+ confirm) / `POST /api/export-orders` (+ confirm) thật, xử lý đúng lỗi tồn kho không đủ. **Note:** `lib/screens/inventory/quick_order_form_screen.dart`. Vật tư đã chọn sẵn từ D2 (không lặp lại ô tìm kiếm của D1). Đã verify bằng gọi API thật: tạo+xác nhận phiếu nhập tăng đúng tồn kho (0→3), tạo+xác nhận phiếu xuất vượt tồn kho trả đúng lỗi 400 "Tồn kho không đủ để xuất..." hiển thị nguyên văn lên form.

## Giai đoạn E — Luồng chụp ảnh AI (phần quan trọng nhất, độ rủi ro cao)

- [x] E1. Màn hình Camera — full-screen, nút chụp lớn ở giữa dưới, xin quyền camera đúng chuẩn Flutter (`permission_handler`). **Note:** `lib/screens/ai_scan/ai_scan_screen.dart` — `Permission.camera.request()` trước khi mở `image_picker` (ImageSource.camera); permanently-denied → `openAppSettings()`. Thêm `android.permission.CAMERA` vào `AndroidManifest.xml`.
- [x] E2. Gửi ảnh chụp được lên `POST /api/ai/detect` thật, hiển thị loading rõ ràng trong lúc chờ. **Note:** `lib/services/ai_service.dart` (multipart field `image`, đúng hợp đồng đã CHỐT ở 07-DECISIONS-LOG.md), nút chụp đổi thành spinner + "Đang nhận diện..." trong lúc chờ.
- [x] E3. Màn kết quả — ảnh có vẽ bounding box (theo tỉ lệ % thật từ kích thước ảnh trả về, tương tự cách Web đã làm ở F1), danh sách nhãn nhận diện dạng card vuốt ngang, mỗi card có ô sửa số lượng. **Note:** `lib/screens/ai_scan/ai_result_screen.dart` — decode `annotated_image` (data URI) bằng `ui.instantiateImageCodec`, overlay `Positioned` theo `scaleX/scaleY = kích thước hiển thị / kích thước gốc pixel`, cùng công thức Web. **Sửa lỗi phát hiện khi test thật trên điện thoại:** card cố định `height: 190` bị "BOTTOM OVERFLOWED BY 48 PIXELS" trên thiết bị thật (cỡ chữ hệ thống thật lớn hơn giả định) — tăng lên `230` + bọc `SingleChildScrollView` quanh nội dung card để không bao giờ overflow bất kể tên vật tư dài/cỡ chữ hệ thống lớn tới đâu.
- [x] E4. Bắt buộc map mỗi nhãn AI sang vật tư + vị trí thật (giống Web) vì mock AI không gắn `item_id`. **Note:** mỗi card có dropdown Vật tư + dropdown Vị trí (phụ thuộc 1 kho chọn chung cho cả phiếu); số lượng = 0 nghĩa là bỏ nhãn đó khỏi phiếu (thay cho nút xoá dòng bên Web).
- [x] E5. Nút "Xác nhận tạo phiếu nhập" — gọi `POST /api/import-orders/from-ai` thật, xác nhận tồn kho tăng đúng sau khi tạo. **Note:** `OrderService.createFromAi()` — 1 lời gọi duy nhất (khác D3, order không lộ DRAFT ra ngoài).

**Bằng chứng Giai đoạn E (rủi ro cao, có test cụ thể):**
- `flutter analyze` sạch, `flutter test` 18/18 pass, `flutter build apk --debug` build thành công, cài (`adb install`) và khởi chạy thật trên điện thoại Android thật (RMX2205, Android 13) — logcat xác nhận activity vẽ xong (HAS_DRAWN), không có `FATAL EXCEPTION`/crash trong process của app.
- Verify toàn bộ hợp đồng dữ liệu + luồng nghiệp vụ bằng gọi API thật (tài khoản `staff.test@warehouse.local`): `POST /api/ai/detect` trả đúng 7 detections (5 resistor + 2 ic_chip, khớp mock đã chốt); map resistor→vật tư A (số lượng 5), ic_chip→vật tư B (số lượng 2), cùng 1 kho + 1 vị trí, gọi `POST /api/import-orders/from-ai` → HTTP 201, `status: CONFIRMED` ngay (không qua DRAFT); verify tồn kho tăng đúng 0→5 và 0→2 tại đúng vị trí; `stock_movements` ghi đúng loại `IMPORT`.
- **Phần bắt buộc người dùng tự test bằng tay** (chụp ảnh thật, xin quyền camera thật, xem overlay bounding box hiển thị đúng trên ảnh thật chụp — công cụ không tự thao tác được trên thiết bị): xem hướng dẫn cụ thể đã gửi kèm báo cáo.
- Sự cố môi trường phát sinh khi build cho thiết bị thật (không liên quan code Dart): máy chưa có Android NDK 28.2.13676358 và bộ cài `sdkmanager` mới (Android CLI) bị lỗi khi tự động tải NDK (`Package ndk not found`/crash native) — đã tải thủ công NDK r28c từ kho Google chính thức (`dl.google.com/android/repository/android-ndk-r28c-windows.zip`, verify đúng SHA1 trong `repository2-3.xml`) và giải nén đúng vào `%LOCALAPPDATA%\Android\sdk\ndk\28.2.13676358`, không sửa code/cấu hình dự án.

**Vá lỗi/thiếu sót phát hiện sau khi người dùng tự test thật (2026-09-13, trước khi sang Giai đoạn F):**
- Thêm nút đăng xuất ở AppBar Trang chủ (bị mất khi C1/C2 thay thế màn tạm Giai đoạn B — màn tạm đó có nút đăng xuất, `HomeScreen` thật thì không).
- Áp `AppColors.brandGradient` làm nền cho MỌI AppBar (qua hàm `buildBrandAppBar` mới ở `app_theme.dart`) — khớp đúng ý định đã ghi trong comment A3 nhưng trước đó chưa từng được lắp vào AppBar nào.
- Sửa công thức "Sắp hết hàng" ở `dashboard_provider.dart`: đổi từ cộng dồn tồn kho theo item rồi mới so với `min_stock`, sang đếm theo TỪNG DÒNG tồn kho (mỗi kho/vị trí) có `available_quantity <= min_stock` — đúng hệt Web (`useDashboardStats.ts` dòng 77). Đã verify bằng dữ liệu thật: item min_stock=10, tồn 8+8 ở 2 vị trí — công thức cũ tính 0 (sai), công thức mới tính đúng 2 (khớp Web).
- Đổi nhãn "Chờ xác nhận" → "Phiếu nhập/xuất chờ xác nhận" (Mobile chỉ đếm DRAFT của 2 loại phiếu, không phải 6 loại như Web — đổi nhãn để không gây hiểu lầm khi so với Web).

## Giai đoạn F — Lịch sử

- [ ] F1. Danh sách các phiếu do người dùng tạo gần đây, mỗi dòng icon màu theo loại nghiệp vụ (đồng bộ màu với Web), trạng thái badge (DRAFT/CONFIRMED/CANCELLED — đúng 3 giá trị thật, không bịa thêm).

## Giai đoạn G — Kiểm thử & hoàn thiện

- [ ] G1. Test thủ công (có hướng dẫn cụ thể cho người dùng) luồng chính: đăng nhập → xem tồn kho → tạo phiếu nhanh → chụp ảnh AI → xác nhận → xem lịch sử.
- [ ] G2. Rà lại toàn bộ màu sắc/spacing khớp đúng token đã định nghĩa ở A3, nhất quán với Web.
- [ ] G3. Cập nhật `07-DECISIONS-LOG.md` lần cuối cho Mobile App.
- [ ] G4. Build thử bản release cơ bản (`flutter build apk` hoặc tương đương) xác nhận không lỗi.

---

**Khi nào coi là xong Mobile App:** toàn bộ checkbox đã tick, luồng chụp ảnh AI chạy được với Backend thật, người dùng tự test được bằng hướng dẫn cụ thể và xác nhận ổn. Lúc đó mới nên mở `05-AI-SERVICE-SPEC.md` cho giai đoạn AI Service thật.
