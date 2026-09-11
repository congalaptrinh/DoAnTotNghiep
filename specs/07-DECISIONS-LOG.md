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

## 2026-09-11 — CRUD danh mục (C1-C4): hằng số role, search filter, cập nhật mật khẩu
- Bối cảnh: viết CRUD cho 7 resource (`users`, `roles`, `item-categories`, `items`, `warehouses`, `storage-locations`, `suppliers`), cần vài quy ước chung để không lặp lại quyết định ở từng resource.
- Quyết định:
  - Gom 4 bộ role dùng chung vào `src/utils/roles.js`: `ADMIN_ONLY=['admin']`, `MANAGE_ROLES=['admin','warehouse_manager']`, `STAFF_WRITE_ROLES=['admin','warehouse_manager','warehouse_staff']`, `ALL_ROLES=` cả 4 role. Mọi route file gọi `authorize(...ROLES_CONST)` thay vì liệt kê string tay — tránh gõ sai tên role giữa các file.
  - Route `users`/`roles`: áp `authenticate + authorize(ADMIN_ONLY)` ở cấp `router.use(...)` cho TOÀN BỘ method kể cả GET (khác với các resource khác chỉ giới hạn quyền ghi).
  - Filter dạng "search" (trên `items.item_code`/`item_name`, `suppliers.supplier_name`) dùng Prisma `contains` + `mode: 'insensitive'` — tìm kiếm không phân biệt hoa/thường, khớp một phần chuỗi.
  - `PUT /api/users/:id`: field `password` là optional; nếu không gửi thì giữ nguyên `password_hash` cũ (không ép đổi mật khẩu mỗi lần sửa thông tin khác).
  - `DELETE /api/roles/:id` và `DELETE /api/item-categories/:id` là xoá thật (`prisma.x.delete`), KHÔNG tự viết code kiểm tra "còn bị tham chiếu không" — cố ý dựa vào FK constraint có sẵn trong DB (roles←users là RESTRICT mặc định vì `role_id` bắt buộc; item_categories←items cũng RESTRICT vì `category_id` bắt buộc) + `errorHandler` đã map `P2003`→409 từ B2. Đã verify thực tế cả 2 trường hợp trả đúng 409.
  - Danh sách (list) mỗi resource sắp xếp mặc định theo tên/mã tăng dần (`role_name`, `category_name`, `location_code`, `warehouse_name`, `supplier_name` ASC) hoặc `created_at` giảm dần (`users`, `items`) — chưa có yêu cầu sort tuỳ chỉnh từ FE nên chọn thứ tự dễ đọc nhất theo ngữ cảnh từng resource.
- Ảnh hưởng tới: Backend (Giai đoạn D-G tái dùng `src/utils/roles.js` thay vì định nghĩa lại), Web/Mobile (biết `search` là tìm gần đúng không phân biệt hoa thường; biết PUT user không bắt buộc gửi password).

## 2026-09-11 — Giai đoạn D: test bằng fixture tạm qua Prisma, không dùng API tạo inventory
- Bối cảnh: `GET /api/inventory`/`GET /api/inventory/:itemId` là API chỉ đọc — không có route tạo/sửa `inventory` (đúng thiết kế, vì bảng `inventory` chỉ được thay đổi gián tiếp qua các nghiệp vụ kho ở Giai đoạn E, chưa code). Cần dữ liệu thật để test filter nhưng chưa có cách hợp lệ nào tạo ra nó qua API ở giai đoạn này.
- Quyết định: viết 1 script Node dùng trực tiếp Prisma Client để tạo fixture tối thiểu (2 items, 2 warehouses, 3 storage_locations, 4 dòng inventory dàn trải để test đủ 3 kiểu filter + endpoint theo item), gọi API thật qua server đang chạy để verify, rồi TRONG CÙNG SCRIPT xoá sạch toàn bộ fixture đã tạo (thứ tự xoá đúng theo phụ thuộc FK: inventory → storage_locations → warehouses → items → item_categories) trước khi kết thúc. Không dùng Prisma Studio thủ công (khó tái lặp, dễ quên dọn) — script tự động đảm bảo dọn sạch mỗi lần chạy, kể cả khi chạy lại nhiều lần sau này để hồi quy (regression) cho Giai đoạn D.
- Ảnh hưởng tới: Backend — nếu cần test lại `GET /api/inventory` trước khi Giai đoạn E xong (nghiệp vụ nhập kho thật), lặp lại đúng cách tiếp cận này (script tạm, tự dọn), không để lại dữ liệu giả trong DB dev.

## 2026-09-11 — E1-E2: mã phiếu tự sinh, cách kiểm tra tồn kho trong transaction, RBAC nghiệp vụ kho
- Bối cảnh: viết `stockMovement.helper.js` dùng chung cho E1-E6, cần chốt vài chi tiết mà `02-BACKEND-SPEC.md` chỉ nói nguyên tắc chung ("kiểm tra đủ tồn kho", "transaction", "ghi stock_movements") chứ không nói cách implement cụ thể.
- Quyết định:
  - **Format mã phiếu** (`import_code`, `export_code`, và sẽ áp dụng tương tự cho `transfer_code`/`recovery_code`/`stocktake_code`/`liquidation_code` ở E3-E6): `{PREFIX}-{YYYYMMDD}-{6 ký tự hex viết hoa ngẫu nhiên}`, sinh bởi `src/utils/codeGenerator.js` (`generateCode(prefix)`). Prefix dùng: `IMP`/`EXP`/`TRF`/`REC`/`STK`/`LIQ`. Chọn random suffix thay vì đếm tuần tự trong ngày để tránh race condition khi 2 request tạo phiếu cùng lúc (không cần lock/transaction riêng chỉ để sinh số thứ tự).
  - **Cách kiểm tra tồn kho đủ trước khi trừ**: kiểm tra và trừ NGAY TRONG `prisma.$transaction(async (tx) => {...})`, không kiểm tra trước rồi mới mở transaction. `decrementInventory(tx, ...)` tự `throw new ApiError(400, ...)` ngay khi phát hiện `available_quantity` không đủ; Prisma interactive transaction tự động rollback toàn bộ khi callback throw — đây là cách duy nhất đảm bảo đúng nghĩa "transaction atomic thật" khi phiếu có nhiều dòng (dòng sau thiếu hàng thì dòng trước đã trừ trong cùng transaction cũng phải được hoàn tác). Đã verify thực tế: phiếu 2 dòng, dòng 1 đủ hàng dòng 2 thiếu hàng → dòng 1 KHÔNG bị trừ, phiếu vẫn `DRAFT`, không có `stock_movements` rác nào được ghi.
  - **`quantity` lưu trong `stock_movements`**: luôn là số dương (độ lớn của giao dịch); hướng tăng/giảm được thể hiện qua `movement_type` (`IMPORT` cộng, `EXPORT` trừ...), KHÔNG lưu số âm cho export — khác với `ADJUSTMENT_STOCKTAKE` (sẽ lưu `difference` có thể âm ở E5, vì đó là một con số chênh lệch chứ không phải "khối lượng giao dịch").
  - **RBAC nghiệp vụ kho — phân biệt 2 nhóm**: `import_orders`/`export_orders`/`transfer_orders`/`recovery_orders` (E1-E4) dùng `STAFF_WRITE_ROLES` (admin+manager+staff) cho CẢ tạo lẫn confirm — vì `00-OVERVIEW.md` mục 6 liệt kê rõ "Nhân viên kho: Nhập/xuất/chuyển kho, thu hồi vật tư" là việc của staff, không có bước "duyệt" riêng của quản lý kho cho 4 nghiệp vụ này. Ngược lại `stocktake_sessions`/`liquidation_orders` (E5-E6) sẽ dùng `MANAGE_ROLES` (chỉ admin+manager) vì `00-OVERVIEW.md` liệt kê "Quản lý kho: ...thực hiện kiểm kê/thanh lý" — staff không có trong danh sách này. Đọc (GET) của cả 6 nghiệp vụ đều `ALL_ROLES` (4 role, kể cả report_viewer chỉ xem).
  - **`export_orders.approved_by`**: gán bằng chính `userId` của người gọi `/confirm` (không có bước "duyệt" tách biệt với "xác nhận" — ai xác nhận cũng đồng thời là người duyệt trong transaction đó).
  - **`confirm` chặn gọi lại**: nếu `status` khác `DRAFT` (đã `CONFIRMED` hoặc `CANCELLED`) → 400, không cho confirm 2 lần (tránh cộng/trừ tồn kho trùng lặp).
- Ảnh hưởng tới: Backend (E3-E6 tái dùng nguyên `stockMovement.helper.js` + `codeGenerator.js`, áp dụng đúng nhóm RBAC theo loại nghiệp vụ), Web/Mobile (biết mã phiếu không tuần tự/không đoán được, biết `approved_by` = người bấm confirm).

## 2026-09-11 — E3-E4: chuyển kho cùng kho, thứ tự decrement/increment, upsert vị trí mới ở thu hồi
- Bối cảnh: `transfer_orders` có cả `from_warehouse_id`/`to_warehouse_id` (header) lẫn `from_location_id`/`to_location_id` (từng dòng item) — `02-BACKEND-SPEC.md` không nói rõ 2 kho ở header có bắt buộc phải khác nhau không.
- Quyết định:
  - **Cho phép `from_warehouse_id === to_warehouse_id`** (chuyển vị trí trong cùng 1 kho) — đây là trường hợp phổ biến nhất trong thực tế (đổi kệ/khay), spec `01-DATABASE-SCHEMA.md` không đặt ràng buộc 2 kho phải khác nhau, `00-OVERVIEW.md` cũng chỉ nói chung "chuyển kho". Không thêm validate chặn.
  - **Thứ tự xử lý trong transaction của `confirm`**: với mỗi dòng, LUÔN `decrementInventory` (trừ tại nguồn) TRƯỚC rồi mới `incrementInventory` (cộng tại đích) — nếu nguồn không đủ thì throw ngay, không kịp cộng vào đích (tránh tạo dòng inventory "ma" ở đích rồi phải rollback ngược). Ghi `stock_movements` (2 dòng `TRANSFER_OUT`+`TRANSFER_IN`) sau cùng, sau khi cả 2 thao tác tồn kho của dòng đó đã thành công — nếu dòng tiếp theo trong vòng lặp fail, Prisma transaction rollback cả những gì dòng trước đã làm (kể cả đã ghi `stock_movements`), nên thứ tự trong 1 dòng không quan trọng bằng việc TOÀN BỘ vòng lặp nằm trong cùng 1 `prisma.$transaction`.
  - **Thu hồi (`recovery_orders`) tái sử dụng `incrementInventory` y hệt nhập kho** — không viết logic riêng, vì bản chất nghiệp vụ giống nhau (cộng tồn kho + ghi movement), chỉ khác `movement_type`/`reference_type`. Đã verify: thu hồi vào vị trí chưa từng có dòng `inventory` → tự tạo mới (upsert) đúng, không cần phân biệt "vị trí mới" vs "vị trí đã có" ở tầng service.
- Ảnh hưởng tới: Backend (E5-E6 tiếp tục theo đúng pattern "toàn bộ vòng lặp nhiều dòng nằm trong 1 `prisma.$transaction`, throw ở bất kỳ dòng nào cũng rollback sạch"), Web/Mobile (form chuyển kho không cần chặn UI khi chọn cùng 1 kho ở nguồn/đích).

## 2026-09-11 — E5: kiểm kê snapshot toàn kho, PATCH nhập số lượng, SET tuyệt đối
- Bối cảnh: `02-BACKEND-SPEC.md` mục 4.5 mô tả nghiệp vụ kiểm kê ở mức nguyên tắc ("hệ thống snapshot", "nhân viên nhập actual_quantity", "cập nhật inventory.quantity = actual_quantity") nhưng không nói rõ API shape cho bước "tạo phiên" và bước "nhập số lượng" (2 bước tách biệt, khác hẳn E1-E4 chỉ có tạo+confirm).
- Quyết định:
  - **`POST /api/stocktake-sessions`**: chỉ nhận `{warehouse_id, stocktake_date?, note?}` — KHÔNG nhận danh sách item từ client. Server tự động snapshot TOÀN BỘ dòng `inventory` hiện có của `warehouse_id` đó tại đúng thời điểm gọi API (không cho client chọn item nào để kiểm kê — kiểm kê là kiểm toàn bộ kho, đúng tinh thần nghiệp vụ thực tế).
  - **Route nhập số lượng thực tế**: `PATCH /api/stocktake-sessions/:id/items` (không phải PUT toàn phiên), body `{items: [{stocktake_item_id, actual_quantity}]}` — cho phép gọi nhiều lần trước khi confirm (nhân viên đếm xong dòng nào nhập dòng đó, không cần nhập hết 1 lần). Mỗi lần gọi tự tính lại `difference = actual_quantity - system_quantity` (so với `system_quantity` đã snapshot cố định lúc tạo phiên, KHÔNG so với tồn kho live hiện tại).
  - **`setInventoryQuantity(tx, {...})`** (hàm mới trong `stockMovement.helper.js`): SET thẳng `inventory.quantity = quantity` tham số truyền vào, không cộng/trừ dựa trên giá trị hiện có — khác hẳn `incrementInventory`/`decrementInventory`. Đây là điểm dễ code sai nhất của cả nghiệp vụ kiểm kê (nhầm thành "cộng `difference` vào tồn kho hiện tại" thay vì "gán thẳng bằng `actual_quantity`") — 2 cách cho ra kết quả GIỐNG NHAU nếu không có nghiệp vụ nào khác xen vào giữa lúc snapshot và lúc confirm, nhưng SAI KHÁC NHAU nếu có (ví dụ có phiếu nhập kho khác xảy ra giữa lúc snapshot và confirm). Đã cố tình viết test mô phỏng đúng tình huống này để phân biệt 2 cách — xem `06-BUILD-CHECKLIST.md` E5.
  - **Dòng có `difference === 0`**: `confirm` bỏ qua hoàn toàn (không gọi `setInventoryQuantity`, không ghi `stock_movements`) — đúng nghĩa "không có biến động" thì không cần ghi log.
  - **`confirm` chặn khi còn dòng `actual_quantity === null`**: kiểm tra TRƯỚC khi mở `$transaction` (khác với kiểm tra tồn kho đủ ở E2/E3/E6 phải nằm trong transaction) — vì đây không phải race condition trên số lượng, mà là điều kiện tiên quyết về tính đầy đủ dữ liệu, không cần rollback transaction để xử lý.
- Ảnh hưởng tới: Backend, Web/Mobile (màn kiểm kê cần luồng 3 bước: tạo phiên → nhập nhiều lần qua PATCH → confirm cuối; không có form nào cho phép nhập tay `system_quantity` hay chọn item để kiểm kê).

## 2026-09-11 — E6: thanh lý giới hạn admin+manager (khác E1-E4)
- Bối cảnh: `00-OVERVIEW.md` mục 6 liệt kê "Quản lý kho: ...thực hiện kiểm kê/thanh lý" — không có "thanh lý" trong danh sách việc của "Nhân viên kho" (staff chỉ có "Nhập/xuất/chuyển kho, thu hồi vật tư").
- Quyết định: `POST /api/liquidation-orders` và `POST /:id/confirm` dùng `authorize(...MANAGE_ROLES)` (admin+manager), KHÔNG dùng `STAFF_WRITE_ROLES` như E1-E4. Đây là nghiệp vụ nghiệp vụ thứ 2 (cùng nhóm với E5 kiểm kê) bị giới hạn khỏi staff. Đã verify thực tế: token staff gọi `POST /api/liquidation-orders` → 403.
- Ảnh hưởng tới: Backend, Web/Mobile (nút "Tạo phiếu thanh lý" chỉ hiện với role admin/quản lý kho, ẩn với nhân viên kho — giống màn kiểm kê).

## 2026-09-11 — E7: thứ tự sắp xếp lịch sử biến động kho
- Bối cảnh: `02-BACKEND-SPEC.md` không nói `GET /api/stock-movements` trả về theo thứ tự tăng dần hay giảm dần theo thời gian.
- Quyết định: `orderBy: { movement_date: 'asc' }` — TĂNG DẦN (cũ nhất trước), khác với các danh sách phiếu (`import_orders`, `export_orders`...) đang sort `created_at: 'desc'` (mới nhất trước). Lý do: đây là "lịch sử biến động" của 1 vật tư/kho — đọc theo trình tự xảy ra (timeline) tự nhiên hơn khi xem lại quá trình tăng/giảm tồn kho theo mốc thời gian, khác với danh sách phiếu (nơi người dùng quan tâm phiếu MỚI TẠO trước tiên). Nếu FE muốn hiển thị mới nhất trước, tự đảo mảng ở client hoặc yêu cầu bổ sung param sort sau.
- Ảnh hưởng tới: Web/Mobile (màn lịch sử biến động kho nhận dữ liệu theo thứ tự cũ→mới, không phải mới→cũ như các danh sách phiếu khác).

## 2026-09-11 — F1: cấu trúc JSON mock CHÍNH XÁC của `POST /api/ai/detect` (hợp đồng dữ liệu cho Web/Mobile)
- Bối cảnh: AI Service (Python FastAPI + YOLO) chưa tồn tại. `05-AI-SERVICE-SPEC.md` chỉ đưa cấu trúc ví dụ/gợi ý ("cấu trúc trên là gợi ý — điều chỉnh field cho khớp"). Backend phải CHỐT CỨNG 1 cấu trúc cụ thể ngay bây giờ để Web/Mobile code UI luồng "nhập kho bằng AI" (3 bước: upload ảnh → hiển thị bounding box + bảng xác nhận → gọi `/from-ai`) mà không phải sửa lại khi AI Service thật xong.
- Quyết định — response `POST /api/ai/detect` (200, field `data` bên trong response chuẩn `{success,data,message}`):
  ```json
  {
    "success": true,
    "data": {
      "detections": [
        {
          "class_name": "resistor",
          "confidence": 0.92,
          "bounding_box": { "x": 120, "y": 80, "width": 40, "height": 25 }
        }
      ],
      "summary": [
        { "class_name": "resistor", "count": 5 },
        { "class_name": "ic_chip", "count": 2 }
      ],
      "annotated_image": "data:image/jpeg;base64,<...>"
    },
    "message": "Nhận diện thành công (MOCK — chưa tích hợp AI Service thật)"
  }
  ```
  - `detections`: mảng, MỖI phần tử là 1 vật thể nhận diện được (không gộp) — `class_name` (string), `confidence` (number, 0-1), `bounding_box` (object 4 field `x`/`y`/`width`/`height`, đều number, đơn vị pixel trên ảnh gốc).
  - `summary`: mảng đã gộp theo `class_name` — `class_name` (string), `count` (number nguyên) — Web/Mobile dùng mảng này để hiển thị bảng xác nhận số lượng theo loại, KHÔNG cần tự đếm lại từ `detections`.
  - `annotated_image`: string, luôn có tiền tố `data:image/<mime>;base64,` (data URI, không phải URL) — hiện tại ở bước mock là CHÍNH ẢNH GỐC người dùng upload (encode lại base64, không vẽ bounding box thật vì chưa có OpenCV/YOLO); khi AI Service thật tích hợp, field này vẫn giữ đúng format data URI nhưng nội dung sẽ là ảnh đã vẽ bounding box thật.
  - Request: `multipart/form-data`, field bắt buộc tên `image` (không phải `file` hay tên khác), giới hạn 10MB (Multer `limits.fileSize`).
  - Thiếu field `image` → 400, message "Vui lòng chọn ảnh để nhận diện (field "image")".
  - RBAC: `STAFF_WRITE_ROLES` (admin+manager+staff) — khớp `00-OVERVIEW.md` "Nhân viên kho: ...dùng AI hỗ trợ nhập kho".
- Ảnh hưởng tới: **Web/Mobile (QUAN TRỌNG — đây là hợp đồng dữ liệu cố định)**: form upload ảnh phải đặt tên field `image`; bảng xác nhận trước khi tạo phiếu nhập nên dựng từ `summary` (loại + số lượng), còn `detections` dùng để vẽ overlay bounding box lên `annotated_image` nếu cần hiển thị chi tiết từng vật thể; `annotated_image` render trực tiếp bằng `<img src="...">` vì đã là data URI, không cần tải thêm.

## 2026-09-11 — F2: gộp create+confirm trong 1 transaction cho luồng AI
- Bối cảnh: `02-BACKEND-SPEC.md` mục 4.1 gợi ý "có thể gộp tạo + confirm làm 1 bước" cho luồng nhập kho bằng AI nhưng không bắt buộc cách làm cụ thể.
- Quyết định: viết hàm riêng `importOrder.service.js#createFromAi()` — KHÔNG gọi lại `create()` rồi `confirm()` nối tiếp nhau (2 lệnh gọi Prisma riêng, 2 transaction riêng), mà viết logic tạo phiếu + `incrementInventory` + `recordMovement` + set `status=CONFIRMED` tất cả bên trong **1** `prisma.$transaction(async (tx) => {...})` duy nhất. Lý do: nếu tách 2 bước (dù gọi liên tiếp trong cùng request), giữa 2 bước có thể có 1 khoảng hở nơi phiếu tồn tại ở trạng thái `DRAFT` mà hệ thống (hoặc request khác) có thể đọc thấy; gộp vào 1 transaction đảm bảo bên ngoài chỉ BAO GIỜ thấy phiếu ở trạng thái `CONFIRMED` (transaction chỉ commit sau khi mọi bước xong) — đúng tinh thần "người dùng đã xác nhận trên UI rồi, hệ thống không cần thêm bước duyệt trung gian nào nữa".
- Đây là route/hàm DUY NHẤT trong toàn bộ nghiệp vụ kho làm theo kiểu "tạo xong = xác nhận luôn" — mọi nghiệp vụ khác (E1-E6) đều giữ 2 bước tách biệt (tạo DRAFT → gọi `/confirm` riêng).
- Ảnh hưởng tới: Backend (không tạo route `GET`/`PUT` sửa phiếu `from-ai` ở trạng thái DRAFT vì trạng thái đó không bao giờ tồn tại ra bên ngoài), Web/Mobile (luồng AI trên UI gọi thẳng 1 API `/from-ai` sau khi người dùng bấm "Xác nhận tạo phiếu", không cần bước "Xác nhận phiếu" riêng như các luồng nhập kho thường).
