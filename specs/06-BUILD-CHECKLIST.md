# 06 — BUILD CHECKLIST: DATABASE + BACKEND (giai đoạn hiện tại)

> **PHẠM VI GIAI ĐOẠN NÀY: chỉ Database + Backend.** KHÔNG code Web App, Mobile App, hay AI Service ở giai đoạn này, kể cả khi thấy "tiện" — nếu cần biết Web/Mobile/AI sẽ dùng dữ liệu này thế nào, đọc `00-OVERVIEW.md` để hiểu bối cảnh, nhưng không viết code cho các phần đó.
>
> **Quy tắc làm việc:**
> 1. Làm đúng thứ tự các mục bên dưới, từ trên xuống. Không bỏ qua bước, không làm tắt.
> 2. Sau khi hoàn thành 1 mục, đánh dấu `[x]` vào ô tương ứng trong chính file này, ghi 1 dòng note ngắn (đã tạo gì/quyết định gì), rồi mới sang mục tiếp theo.
> 3. Nếu gặp chi tiết mà spec (`01-DATABASE-SCHEMA.md`, `02-BACKEND-SPEC.md`) chưa nói rõ, tự quyết định hợp lý nhất, **rồi ghi lại quyết định đó vào `07-DECISIONS-LOG.md`** — không âm thầm tự quyết mà không ghi chú.
> 4. Nếu một bước bắt buộc phải sửa/thêm gì đó khác với spec đã cho, dừng lại và hỏi người dùng trước khi đổi, trừ khi là chi tiết nhỏ không ảnh hưởng cấu trúc chung.
>
> **GHI CHÚ KHÔI PHỤC (quan trọng):** Toàn bộ nội dung bên dưới là bản ghi lại công việc THẬT đã hoàn thành ở phiên làm việc trước, nhưng folder code gốc trên máy đã bị mất. File này chỉ còn là TÀI LIỆU MÔ TẢ những gì đã làm — không phải code thật. Khi bắt đầu lại, Claude Code cần VIẾT LẠI TOÀN BỘ CODE từ đầu, nhưng nên bám sát các quyết định/note đã ghi dưới đây để không phải suy nghĩ lại từ đầu (tên bảng, convention, quy tắc RBAC, cấu trúc mock AI...). Trước khi bắt đầu, kiểm tra xem database trên Neon còn tồn tại không — nếu còn, có thể tận dụng lại schema đã có thay vì tạo mới.

---

## Giai đoạn A — Database

- [x] A1. Khởi tạo project Backend (NodeJS + Express), cài Prisma, kết nối PostgreSQL (`.env` với `DATABASE_URL`). Note: `npm init`, cài express/cors/dotenv/@prisma/client + devDeps prisma/nodemon; PostgreSQL 16 chạy qua Docker Compose (`backend/docker-compose.yml`, container `warehouse_postgres`, đã `docker compose up -d`); `.env` + `.env.example` tạo `DATABASE_URL`, `PORT`, `JWT_SECRET`; `src/app.js` (Express app + `/health`) và `src/server.js` (kết nối Prisma rồi listen) test chạy OK, log "Database connected" + "Server is running on port 5000". Prisma ghim ở v6.19.3 (xem 07-DECISIONS-LOG.md — Prisma 7 mới phát hành có breaking change không phù hợp).
- [x] A2. Viết `schema.prisma` đầy đủ theo `01-DATABASE-SCHEMA.md` (toàn bộ bảng ở mục 1–13, kể cả các bảng bổ sung: recovery, stocktake, liquidation, stock_movements). Note: 21/22 bảng (bỏ `equipment_units` — xem 07-DECISIONS-LOG.md); PK dạng UUID; field snake_case trực tiếp; enum `EntityStatus`/`OrderStatus`/`MovementType`/`ReferenceType` dùng chung; đầy đủ quan hệ, unique constraint, index theo gợi ý của spec. Đã `prisma format` + `prisma validate` pass.
- [x] A3. Chạy migration đầu tiên (`prisma migrate dev`), xác nhận toàn bộ bảng + khóa ngoại + index tạo đúng. Note: migration `20260715032551_init` áp thành công; xác nhận qua `psql`: 21 bảng nghiệp vụ (+ `_prisma_migrations`), 47 foreign key, 82 index; kiểm tra mẫu bảng `inventory` đúng cấu trúc + ràng buộc unique `(item_id, warehouse_id, location_id)`.
- [x] A4. Viết seed script tối thiểu: roles mặc định (admin/warehouse_manager/warehouse_staff/report_viewer), 1 user admin để test đăng nhập. Note: `prisma/seed.js` (chạy bằng `npm run prisma:seed`), dùng `upsert` nên chạy lại nhiều lần an toàn. Seed 4 role đúng tên theo `02-BACKEND-SPEC.md` mục 2. Tạo user admin `admin@warehouse.local` / `Admin@123` (mật khẩu hash bằng bcrypt, salt rounds 10) — xem 07-DECISIONS-LOG.md. Đã verify qua `psql`: 4 roles + 1 admin user liên kết đúng role.

## Giai đoạn B — Nền tảng Backend

- [x] B1. Setup cấu trúc thư mục Backend (routes/controllers/services/middlewares theo convention rõ ràng, ghi lại convention vào `07-DECISIONS-LOG.md`). Note: `src/{routes,controllers,services,middlewares,utils,validators}`; `prisma/` giữ ở root (xem 07-DECISIONS-LOG.md).
- [x] B2. Middleware xử lý lỗi tập trung + response format chuẩn `{ success, data, message }`. Note: `src/utils/response.js` (success/fail), `src/utils/ApiError.js`, `src/middlewares/errorHandler.js` (bắt cả lỗi Prisma P2002/P2003/P2025), `src/middlewares/notFoundHandler.js`. Express 5 tự forward lỗi async ra error middleware, không cần asyncHandler wrapper riêng.
- [x] B3. Auth: `POST /api/auth/login` (JWT), `GET /api/auth/me`, middleware xác thực JWT. Note: `src/services/auth.service.js`, `src/middlewares/auth.js` (`authenticate`). Test thực tế: sai mật khẩu → 401 đúng message; đăng nhập đúng → JWT hợp lệ; `/me` có token → trả user (ẩn `password_hash`); không token → 401; route lạ → 404 chuẩn.
- [x] B4. Middleware RBAC theo role, áp dụng thử trên 1 route mẫu để xác nhận hoạt động đúng. Note: `authorize(...roles)` trong `src/middlewares/auth.js`, verify trực tiếp trên CRUD `/api/users` (C1, chỉ admin) — xem note C1.

## Giai đoạn C — CRUD danh mục

- [x] C1. CRUD `/api/users`, `/api/roles` (chỉ Admin). Note: `user.*`/`role.*` (routes/controllers/services/validators). Users: DELETE = soft delete (status→INACTIVE), password hash bcrypt khi tạo/đổi. Test thực tế: admin CRUD OK; tạo user `warehouse_staff`, login user đó rồi gọi `/api/users`, `/api/roles` → 403 đúng (RBAC hoạt động); soft-delete → user không login được (403 "đã bị khóa"); PUT bật lại ACTIVE → login lại được.
- [x] C2. CRUD `/api/item-categories`, `/api/items`. Note: đọc = 4 role; ghi = `admin`+`warehouse_manager` (xem 07-DECISIONS-LOG.md). `items` DELETE = soft delete; `item_categories` DELETE = xoá thật (không có cột status). `items` hỗ trợ filter `category_id`/`status`/`search` (item_code, item_name).
- [x] C3. CRUD `/api/warehouses`, `/api/storage-locations`. Note: `warehouses` ghi = admin+manager; `storage-locations` ghi = admin+manager+**staff** (staff được "cập nhật vị trí lưu trữ" theo 00-OVERVIEW.md). Cả 2 DELETE = soft delete (status→INACTIVE).
- [x] C4. CRUD `/api/suppliers`. Note: ghi = admin+manager, đọc = 4 role, DELETE = soft delete, hỗ trợ filter `status`/`search` (supplier_name). Test thực tế toàn bộ C2-C4: tạo category→item→warehouse→storage-location→supplier thành công; RBAC verify: report_viewer GET items = 200 nhưng POST = 403; warehouse_staff POST items = 403 nhưng POST storage-locations được phép (qua được RBAC, chỉ còn lỗi validate 400).

## Giai đoạn D — Tồn kho (đọc)

- [x] D1. `GET /api/inventory` (filter item/warehouse/location). Note: đọc cho cả 4 role.
- [x] D2. `GET /api/inventory/:itemId`. Note: trả toàn bộ dòng tồn kho của 1 vật tư theo từng vị trí (không phân trang, filter thêm được `warehouse_id`).

## Giai đoạn E — Nghiệp vụ kho (mỗi bước: tạo phiếu → xác nhận có transaction → ghi stock_movements)

- [x] E1. Nhập kho: `/api/import-orders` (tạo, xem, confirm). Note: helper dùng chung `src/services/stockMovement.helper.js` (incrementInventory/decrementInventory/recordMovement). `import_code` tự sinh (xem 07-DECISIONS-LOG.md). Test thật: nhập 100 → confirm → inventory quantity=available=100 đúng.
- [x] E2. Xuất kho: `/api/export-orders` (tạo, xem, confirm, kiểm tra tồn kho đủ). Note: confirm cũng set `approved_by` = người xác nhận (xem quyết định). Test thật: xuất 30 → còn 70; xuất 1000 (thiếu hàng) → 400, tồn kho KHÔNG đổi; test rollback 2-dòng (dòng 1 đủ hàng, dòng 2 thiếu) → toàn bộ phiếu bị huỷ, dòng 1 cũng không bị trừ (transaction atomic xác nhận đúng).
- [x] E3. Chuyển kho: `/api/transfer-orders` (tạo, xem, confirm, kiểm tra tồn kho nguồn đủ). Note: test thật chuyển 20 đơn vị giữa 2 vị trí cùng kho — nguồn giảm, đích tăng đúng, ghi đủ 2 dòng TRANSFER_OUT/TRANSFER_IN.
- [x] E4. Thu hồi: `/api/recovery-orders` (tạo, xem, confirm). Note: test thật thu hồi 5 đơn vị → tồn kho tăng đúng.
- [x] E5. Kiểm kê: `/api/stocktake-sessions` (tạo phiên snapshot, nhập actual_quantity, confirm điều chỉnh). Note: chỉ admin+manager (tạo/nhập/confirm). Route nhập số lượng: `PATCH /:id/items` (xem 07-DECISIONS-LOG.md). Test thật: tạo phiên snapshot đúng 2 dòng tồn kho hiện có; confirm sớm khi chưa nhập đủ → 400; nhập actual_quantity → difference tự tính đúng (55→50 = -5); confirm → inventory set về đúng actual_quantity, ghi `ADJUSTMENT_STOCKTAKE` với quantity=difference (âm).
- [x] E6. Thanh lý: `/api/liquidation-orders` (tạo, xem, confirm, kiểm tra tồn kho đủ). Note: chỉ admin+manager; confirm set `approved_by`. Test thật: staff bị chặn 403; admin tạo+confirm 5 đơn vị → tồn kho giảm đúng, `approver` trả đúng email người confirm.
- [x] E7. `GET /api/stock-movements` (filter đầy đủ). Note: filter `item_id`/`warehouse_id`/`location_id`/`movement_type`/`reference_type`/khoảng ngày (`from`,`to`). Test thật: lọc theo 1 item, thấy đủ 7/7 loại `movement_type` (IMPORT, EXPORT, TRANSFER_IN, TRANSFER_OUT, RECOVERY, ADJUSTMENT_STOCKTAKE, LIQUIDATION) đúng thứ tự thời gian.

## Giai đoạn F — Chuẩn bị tích hợp AI (chỉ phần Backend, chưa động vào AI Service thật)

- [x] F1. `POST /api/ai/detect` — tạm thời có thể mock (trả dữ liệu giả lập đúng cấu trúc theo `05-AI-SERVICE-SPEC.md`) vì AI Service chưa làm ở giai đoạn này. Đánh dấu rõ trong code là mock, kèm TODO khi tích hợp thật. Note: `src/services/ai.service.js` có comment MOCK + TODO rõ ràng. Multer memory storage (field `image`, giới hạn 10MB). Quyền: admin+manager+staff. Test thật: upload ảnh giả → trả đúng cấu trúc `{detections, summary, annotated_image}` (annotated_image = ảnh gốc base64, mock); không có file → 400.
- [x] F2. `POST /api/import-orders/from-ai` — nhận dữ liệu đã "xác nhận" (giả lập), tạo phiếu nhập như flow E1. Note: gộp create+confirm trong CÙNG 1 transaction (xem 07-DECISIONS-LOG.md). Test thật: gọi trực tiếp với items → phiếu tạo ra có status CONFIRMED ngay, tồn kho cộng đúng.

## Giai đoạn G — Kiểm thử & bàn giao

- [x] G1. Test tối thiểu theo mục 6 của `02-BACKEND-SPEC.md` (transaction rollback, RBAC, tồn kho không đủ). Note: Jest + Supertest, DB test riêng `warehouse_test_db`. 6 file test (`tests/*.test.js`), **33 test case**, `npm test` pass 100%: login sai/đúng, user INACTIVE, 401/403 RBAC, nhập/xuất/chuyển/thu hồi/kiểm kê/thanh lý happy-path, tồn kho không đủ (export/transfer/liquidation) trả 400 không đổi dữ liệu, rollback transaction 2 dòng, + đợt bổ sung sau audit: DELETE cho roles (xoá thật + 409 khi đang bị tham chiếu)/item-categories (xoá thật + 409 khi có item con)/items (soft-delete)/storage-locations (soft-delete + PUT)/suppliers (soft-delete + PUT), và `POST /api/ai/detect` (thành công/thiếu file 400/RBAC 403/thiếu token 401).
- [x] G2. Postman collection đầy đủ toàn bộ API đã code. Note: `backend/postman/warehouse-backend.postman_collection.json` — 17 folder, **75 request** (bổ sung DELETE cho roles/item-categories/items/storage-locations/suppliers, PUT cho storage-locations/suppliers so với bản đầu). Test script tự động lưu id vào collection variables; các request "xoá" dùng resource tạo riêng (`*_id_to_delete`) để không phá id đang được các folder nghiệp vụ phía sau dùng lại. Sửa 1 lỗi phát hiện qua audit: "Nhap so luong thuc te" trước đây chỉ điền `actual_quantity` cho dòng đầu tiên trong phiên kiểm kê nên `Confirm stocktake session` báo 400 khi kho có ≥2 dòng tồn kho — nay dùng pre-request script điền đủ toàn bộ dòng. Đã verify bằng Newman: **75/75 request OK, 12/12 assertion pass, chạy lặp lại 3 lần liên tiếp không lỗi**.
- [x] G3. Cập nhật `07-DECISIONS-LOG.md` lần cuối cho giai đoạn này. Note: đã rà soát lại toàn bộ mục trong 07-DECISIONS-LOG.md, khớp đúng với code thực tế.

---

**Khi nào coi là xong giai đoạn Database + Backend:** tất cả checkbox trên đã tick, Postman collection chạy được toàn bộ nghiệp vụ, và `07-DECISIONS-LOG.md` phản ánh đúng những gì đã code. Lúc đó mới nên mở lại `03-WEB-SPEC.md` / `04-MOBILE-SPEC.md` / `05-AI-SERVICE-SPEC.md` cho giai đoạn tiếp theo.
