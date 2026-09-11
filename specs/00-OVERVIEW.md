# 00 — TỔNG QUAN DỰ ÁN

> Đây là file đọc đầu tiên. Sau file này, đưa cho AI agent đúng file spec của phần đang làm:
> `01-DATABASE-SCHEMA.md` → `02-BACKEND-SPEC.md` → `03-WEB-SPEC.md` / `04-MOBILE-SPEC.md` / `05-AI-SERVICE-SPEC.md`.
> Tất cả các file đều nằm trong cùng thư mục `specs/` và tham chiếu chéo lẫn nhau — AI agent nên có quyền đọc cả thư mục.

## 1. Bài toán

Hệ thống quản lý kho linh kiện điện tử và thiết bị kỹ thuật (điện trở, tụ điện, IC, vi điều khiển, module, cảm biến, thiết bị đo, bộ nguồn, dụng cụ kỹ thuật...) dành cho phòng thí nghiệm / xưởng kỹ thuật / đơn vị nghiên cứu. Quản lý thủ công (sổ sách, Excel) gây khó kiểm soát tồn kho, khó truy vị trí, nhầm lẫn nhập/xuất, tốn thời gian kiểm kê.

## 2. Giải pháp — 3 thành phần

1. **Web App** (ReactJS) — quản trị, xử lý nghiệp vụ kho trên máy tính.
2. **Mobile App** (Flutter) — thao tác nhanh tại kho: xem tồn kho, nhập/xuất, kiểm tra vị trí, chụp ảnh linh kiện.
3. **AI Service** (Python FastAPI + YOLO) — nhận diện loại linh kiện + đếm số lượng từ ảnh, hỗ trợ nhập kho. Người dùng luôn xác nhận/chỉnh sửa kết quả AI trước khi hệ thống cập nhật tồn kho — AI không bao giờ tự ghi thẳng vào tồn kho.

## 3. Mục tiêu cụ thể

- Web App cho Admin, Quản lý kho, Nhân viên kho, Người xem báo cáo.
- Mobile App Flutter cho nhân viên kho.
- Quản lý danh mục linh kiện/thiết bị, kho, vị trí lưu trữ, tồn kho.
- Nghiệp vụ: nhập kho, xuất kho, chuyển kho, thu hồi, kiểm kê, thanh lý.
- Lưu lịch sử biến động kho đầy đủ.
- Tích hợp AI nhận diện linh kiện + số lượng từ ảnh, có bước xác nhận thủ công.
- Kiến trúc mở rộng được: báo cáo, thống kê, QR/Barcode trong tương lai.

## 4. Tech stack (bắt buộc — không tự đổi sang stack khác)

| Thành phần | Công nghệ |
|---|---|
| Frontend Web | ReactJS |
| Mobile App | Flutter (Dart) |
| Backend | NodeJS + ExpressJS, REST API |
| ORM | Prisma |
| Database | PostgreSQL |
| AI Service | Python + FastAPI + YOLO + OpenCV |
| API testing | Postman |
| Source control | Git + GitHub |
| Gán nhãn dữ liệu ảnh AI | Roboflow / LabelImg |

## 5. Kiến trúc tổng quan

```
ReactJS Web App  ─┐
                   ├──►  NodeJS + ExpressJS Backend  ──►  PostgreSQL (qua Prisma ORM)
Flutter Mobile App─┘                │
                                     ▼
                        Python FastAPI AI Service (YOLO + OpenCV)
```

- Web App và Mobile App đều gọi Backend qua **cùng một bộ REST API** (không tách API riêng cho từng nền tảng).
- Backend là trung tâm xử lý nghiệp vụ, truy cập DB qua Prisma, gọi sang AI Service khi cần nhận diện ảnh.
- AI Service tách biệt hoàn toàn khỏi Backend (microservice riêng, giao tiếp HTTP) để dễ phát triển/kiểm thử/nâng cấp mô hình độc lập.

### Cấu trúc thư mục đề xuất (monorepo)

```
/backend         # NodeJS + Express + Prisma
/web             # ReactJS
/mobile          # Flutter
/ai-service      # Python FastAPI + YOLO
/docs            # tài liệu, sơ đồ
```

## 6. Vai trò người dùng & phân quyền

| Vai trò | Quyền chính |
|---|---|
| **Admin** | Quản lý tài khoản người dùng, phân quyền, cấu hình hệ thống |
| **Quản lý kho** | Theo dõi tồn kho, quản lý danh mục vật tư, duyệt phiếu kho, xem lịch sử, thực hiện kiểm kê/thanh lý |
| **Nhân viên kho** | Nhập/xuất/chuyển kho, thu hồi vật tư, cập nhật vị trí lưu trữ, dùng Mobile App, dùng AI hỗ trợ nhập kho |
| **Người xem báo cáo** | Xem tồn kho, lịch sử biến động, danh sách vật tư/thiết bị (read-only) |

Đăng nhập bắt buộc, mật khẩu mã hóa (bcrypt), phân quyền role-based ở tầng API middleware.

## 7. Yêu cầu phi chức năng

- Backend xử lý **transaction** cho mọi thao tác thay đổi tồn kho.
- Mọi thay đổi tồn kho phải ghi vào bảng lịch sử `stock_movements`.
- Giao diện Web rõ ràng cho quản lý; giao diện Mobile tối giản, thao tác nhanh.
- API RESTful chuẩn, dùng chung cho Web và Mobile.
- Response format nhất quán, ví dụ: `{ success, data, message }`.
- Kiến trúc cho phép mở rộng báo cáo/QR/Barcode sau này mà không phải sửa lại schema lớn.

## 8. Thứ tự triển khai đề xuất

1. **Backend nền tảng** — setup Express + Prisma + PostgreSQL, schema đầy đủ (xem `01-DATABASE-SCHEMA.md`), migration.
2. **Auth & phân quyền** — users, roles, JWT, middleware RBAC.
3. **CRUD danh mục** — item_categories, items, warehouses, storage_locations, suppliers.
4. **Tồn kho** — model inventory + API xem tồn kho.
5. **Nghiệp vụ kho** — import → export → transfer → recovery → stocktake → liquidation (mỗi nghiệp vụ kèm transaction + ghi stock_movements). Chi tiết: `02-BACKEND-SPEC.md`.
6. **AI Service** — FastAPI skeleton + endpoint `/detect` (dùng model YOLO pretrained tạm để test luồng, sau thay bằng model đã train riêng). Chi tiết: `05-AI-SERVICE-SPEC.md`.
7. **Tích hợp Backend ↔ AI Service** — endpoint forward ảnh, nhận kết quả, tạo phiếu nhập từ kết quả AI.
8. **Web App** — dựng UI theo từng module. Chi tiết: `03-WEB-SPEC.md`.
9. **Mobile App** — dựng UI Flutter, gọi API dùng chung với Web. Chi tiết: `04-MOBILE-SPEC.md`.
10. **Kiểm thử & hoàn thiện** — test toàn bộ luồng nghiệp vụ.

## 9. Quy tắc chung khi code (áp dụng cho mọi phần)

- Luôn dùng transaction cho thao tác ảnh hưởng tồn kho, không update rải rác nhiều query riêng lẻ.
- Mọi thay đổi số lượng phải có dòng tương ứng trong `stock_movements` — không ngoại lệ.
- Validate input ở Backend (không chỉ tin client).
- Mật khẩu hash bằng bcrypt, không lưu plaintext.
- Đặt tên bảng/cột snake_case đúng như `01-DATABASE-SCHEMA.md` để nhất quán với tài liệu đồ án.
- Nếu cần bảng/API ngoài spec, giữ đúng style đặt tên và pattern đã có, không tự phá cấu trúc.

---

*Đặc tả được soạn dựa trên đề cương đồ án tốt nghiệp "Nghiên cứu, triển khai hệ thống quản lý kho linh kiện điện tử và thiết bị kỹ thuật tích hợp AI" — Cao Xuân Khuê, CT060220, Học viện Kỹ thuật mật mã.*
