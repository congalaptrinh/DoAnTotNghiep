# 08 — BUILD CHECKLIST: WEB APP (ReactJS)

> Bối cảnh: `00-OVERVIEW.md`. Chức năng cần có: `03-WEB-SPEC.md`. API thật đã code: `02-BACKEND-SPEC.md` + `07-DECISIONS-LOG.md` (bám theo cấu trúc response THẬT, không phải chỉ lý thuyết trong spec). Thiết kế đã chốt trên Figma: xem ảnh trong `specs/design/`.
>
> **Quy tắc làm việc: giống hệt `06-BUILD-CHECKLIST.md`** — làm đúng thứ tự, tick `[x]` + ghi note sau mỗi mục, ghi quyết định phát sinh vào `07-DECISIONS-LOG.md`, dừng hỏi nếu cần đổi khác spec/thiết kế.

---

## Giai đoạn A — Nền tảng dự án

- [ ] A1. Khởi tạo project React (Vite khuyến nghị), cài router (React Router), cài React Query/SWR, cài form lib (React Hook Form + zod/yup).
- [ ] A2. Thiết lập Design Tokens từ Figma vào code: file biến màu/spacing/radius/shadow (CSS variables hoặc Tailwind config) — khớp CHÍNH XÁC giá trị đã chốt (gradient indigo #4F46E5→tím #7C3AED, semantic đỏ #DC2626/vàng #F59E0B/xanh #16A34A, nền #F8F9FB...). Ghi lại toàn bộ giá trị token vào `07-DECISIONS-LOG.md` để cố định, tránh mỗi màn tự chế màu khác nhau.
- [ ] A3. Setup kết nối API: base client (axios/fetch wrapper) gắn JWT tự động, đọc `VITE_API_URL` từ `.env`, xử lý lỗi tập trung theo đúng format `{ success, data, message }` của Backend thật.
- [ ] A4. Cấu trúc thư mục: `src/{components,pages,layouts,hooks,services,utils,contexts}`. Ghi convention vào `07-DECISIONS-LOG.md`.

## Giai đoạn B — Component Library dùng chung

> Build đúng theo bộ component đã thiết kế trong Figma (mục 2 của design system): Button (4 variant), Form controls, Badge/Tag, Card, Table (+ empty + skeleton), Toast, Modal, Tabs, Breadcrumb, Avatar, Progress Stepper.

- [ ] B1. Button, Input, Select, Checkbox, Radio, Search bar (đủ trạng thái default/hover/focus/error/disabled).
- [ ] B2. Badge/Tag (7 màu theo thiết kế), Card (stat card, content card).
- [ ] B3. Table dùng chung (sort, filter, pagination, empty state, loading skeleton).
- [ ] B4. Modal, Toast (4 loại: success/error/warning/info), Tabs, Breadcrumb, Avatar.
- [ ] B5. Progress Stepper (dùng cho luồng nhập kho AI 3 bước).

## Giai đoạn C — App Shell & Auth & Phân quyền

- [ ] C1. Layout App Shell: sidebar trái (gradient) + content area, đúng theo `specs/design/app-shell.png`.
- [ ] C2. Trang Đăng nhập (1 màn duy nhất) — gọi `POST /api/auth/login`, lưu JWT, redirect vào app.
- [ ] C3. Context/hook lấy user hiện tại (`GET /api/auth/me`), lưu role vào context toàn app.
- [ ] C4. Hệ thống phân quyền UI dùng chung — 1 chỗ duy nhất (ví dụ hook `usePermission()` hoặc config map `role → danh sách quyền/menu`), KHÔNG rải rác `if (role === 'admin')` khắp nơi. Áp dụng ẩn/hiện menu sidebar theo đúng 4 biến thể đã thiết kế (Admin / Quản lý kho / Nhân viên kho / Người xem báo cáo).
- [ ] C5. Route guard: chặn truy cập trực tiếp URL nếu role không đủ quyền (dù ẩn menu, vẫn cần chặn ở route).

## Giai đoạn D — Dashboard

- [ ] D1. Hero banner + 4 stat card (gọi API tổng hợp — nếu Backend chưa có endpoint tổng hợp riêng, gọi kết hợp `GET /api/inventory` + `GET /api/import-orders?status=PENDING`... và tính ở FE, ghi rõ cách này vào decisions log).
- [ ] D2. Biểu đồ Nhập/Xuất theo tuần (dùng `recharts` hoặc tương tự) — nguồn dữ liệu từ `GET /api/stock-movements`.
- [ ] D3. Feed hoạt động gần đây.

## Giai đoạn E — Danh mục (CRUD UI)

- [ ] E1. Danh mục vật tư (`item_categories`) — bảng cây cha-con.
- [ ] E2. Vật tư (`items`) — bảng + form thêm/sửa, upload ảnh (nếu có).
- [ ] E3. Kho (`warehouses`) — danh sách + form.
- [ ] E4. Vị trí lưu trữ (`storage_locations`) — bảng theo từng kho + form.
- [ ] E5. Nhà cung cấp (`suppliers`) — bảng + form.
- [ ] E6. Tồn kho — bảng chính, filter kho/vị trí, tìm kiếm, badge trạng thái (Thấp/Sắp hết/Ổn định — tính từ `min_stock` so với `quantity`).

## Giai đoạn F — Nghiệp vụ kho (mỗi nghiệp vụ: danh sách phiếu + tạo phiếu + xem chi tiết + nút xác nhận theo quyền)

- [ ] F1. Nhập kho — danh sách + form tạo phiếu thường + **luồng AI đầy đủ** (upload ảnh → gọi `POST /api/ai/detect` → hiển thị bounding box + bảng xác nhận → gọi `POST /api/import-orders/from-ai`), đúng cấu trúc response mock đã ghi trong `07-DECISIONS-LOG.md`.
- [ ] F2. Xuất kho — danh sách + form tạo phiếu, hiển thị rõ lỗi khi tồn kho không đủ (400 từ Backend).
- [ ] F3. Chuyển kho — danh sách + form 2 cột song song (nguồn — đích).
- [ ] F4. Thu hồi — danh sách + form tạo phiếu.
- [ ] F5. Kiểm kê — danh sách phiên + màn nhập actual_quantity (bảng Hệ thống/Thực tế/Chênh lệch, tô màu theo dấu).
- [ ] F6. Thanh lý — danh sách + form tạo phiếu.
- [ ] F7. Nút "Xác nhận/Duyệt" trên từng nghiệp vụ chỉ hiện với role đủ quyền (theo bảng phân quyền `00-OVERVIEW.md`).

## Giai đoạn G — Lịch sử & Quản trị

- [ ] G1. Lịch sử biến động kho — bảng log + bộ lọc đầy đủ (item/kho/loại nghiệp vụ/khoảng ngày), icon+màu theo loại nghiệp vụ.
- [ ] G2. Quản lý người dùng (chỉ Admin) — bảng + form thêm/sửa + gán vai trò.
- [ ] G3. Quản lý vai trò (chỉ Admin) — danh sách.

## Giai đoạn H — Kiểm thử & hoàn thiện

- [ ] H1. Test thủ công đủ 4 vai trò — đăng nhập lần lượt 4 tài khoản (dùng seed data Backend), xác nhận đúng menu/nút hiện-ẩn theo từng vai trò.
- [ ] H2. Test responsive cơ bản (không bắt buộc tối ưu mobile vì đã có app riêng, nhưng không được vỡ layout ở màn hình laptop nhỏ).
- [ ] H3. Test luồng nhập kho bằng AI end-to-end với Backend thật (không mock ở FE).
- [ ] H4. Rà lại toàn bộ để không còn màu/spacing tự chế lệch khỏi token đã định nghĩa ở A2.
- [ ] H5. Cập nhật `07-DECISIONS-LOG.md` lần cuối cho giai đoạn Web App.

---

**Khi nào coi là xong Web App:** toàn bộ checkbox đã tick, cả 4 vai trò test thủ công đều đúng theo thiết kế phân quyền, luồng nhập kho AI chạy được với Backend thật (không phải giả lập ở FE). Lúc đó mới nên mở `04-MOBILE-SPEC.md` cho giai đoạn Mobile App.
