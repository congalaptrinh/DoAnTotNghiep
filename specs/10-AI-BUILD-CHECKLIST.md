# 10 — BUILD CHECKLIST: AI SERVICE (Python + FastAPI + YOLO)

> Bối cảnh: `00-OVERVIEW.md`. Chức năng cần có: `05-AI-SERVICE-SPEC.md`. Cấu trúc JSON đã chốt làm hợp đồng dữ liệu với Backend: xem `07-DECISIONS-LOG.md` phần mock AI (Giai đoạn F Backend). Model đã huấn luyện: `ai-service/models/best.pt` (YOLOv9, fine-tune từ dataset ElectroCom61 — nguồn: https://github.com/faiyazabdullah/ElectroCom61, cần trích dẫn trong báo cáo đồ án).
>
> **Quy tắc làm việc:** giống hệt các checklist trước — làm đúng thứ tự, tick `[x]` + ghi note sau mỗi mục, ghi quyết định phát sinh vào `07-DECISIONS-LOG.md`. Đang làm trên nhánh Git `feature/ai-service` — mọi push dùng nhánh này, không push vào `main`.
>
> **Nguyên tắc quan trọng nhất của giai đoạn này:** AI Service phải trả về ĐÚNG cấu trúc JSON đã chốt (`detections`, `summary`, `annotated_image`) — Web và Mobile đã code sẵn để đọc đúng cấu trúc này từ bản mock, KHÔNG được đổi field/kiểu dữ liệu khi chuyển sang model thật, nếu không toàn bộ luồng AI ở Web/Mobile sẽ vỡ.

---

## Giai đoạn A — Huấn luyện model (đã hoàn thành ngoài checklist này)

- [x] A1. Tải dataset ElectroCom61 (2071 ảnh, 61 lớp linh kiện điện tử) từ Mendeley Data.
- [x] A2. Huấn luyện model YOLOv9 (gelan-c, 25 epochs) trên Google Colab (GPU T4 miễn phí), dùng mã nguồn fork `SkalskiP/yolov9`.
- [x] A3. Tải file trọng số `best.pt` về, đặt tại `ai-service/models/best.pt`, đã commit lên `feature/ai-service`.

## Giai đoạn B — Nền tảng AI Service

- [ ] B1. Setup project Python: virtual environment (venv), cài `fastapi`, `uvicorn`, `ultralytics`, `opencv-python`, `python-multipart`, `pillow`. Ghi vào `requirements.txt`.
- [ ] B2. `GET /health` — kiểm tra service còn sống, có thể kèm thông tin model đã load thành công chưa.
- [ ] B3. Load model `best.pt` bằng `ultralytics.YOLO` khi service khởi động (không load lại mỗi request — tốn thời gian).
- [ ] B4. Liệt kê đầy đủ 61 tên lớp model nhận diện được (từ `model.names`), đối chiếu bằng mắt với danh mục vật tư thật trong database — chuẩn bị dữ liệu cho bước mapping sau này (chưa cần code mapping ở bước này, chỉ cần liệt kê để người dùng xem).

## Giai đoạn C — Endpoint /detect (phần quan trọng nhất)

- [ ] C1. `POST /detect` — nhận ảnh qua `multipart/form-data` (field `image`), validate có file không (thiếu file → 400).
- [ ] C2. Chạy inference bằng model đã load, lấy kết quả (tên lớp, độ tin cậy, tọa độ bounding box) cho từng đối tượng phát hiện được.
- [ ] C3. Xây dựng `detections`: mảng object, mỗi object có `class_name`, `confidence`, `bounding_box` (x, y, width, height) — đúng cấu trúc đã chốt.
- [ ] C4. Xây dựng `summary`: NHÓM các detections theo `class_name`, ĐẾM số lượng mỗi nhóm — trả về mảng `[{class_name, count}]`. Đây là phần đếm số lượng, không được bỏ sót.
- [ ] C5. Vẽ bounding box + nhãn lên ảnh gốc bằng OpenCV, encode kết quả thành base64, trả về `annotated_image` (định dạng `data:image/jpeg;base64,...`).
- [ ] C6. Trả về JSON theo đúng cấu trúc tổng thể đã chốt: `{success, data: {detections, summary, annotated_image}}` (hoặc đúng format bọc ngoài mà Backend/Web/Mobile đang mong đợi — kiểm tra lại `ai.service.js` bản mock để khớp chính xác).

## Giai đoạn D — Test độc lập (chưa nối Backend)

- [ ] D1. Test bằng 1 ảnh có NHIỀU linh kiện CÙNG LOẠI (ví dụ nhiều điện trở) — xác nhận `summary` đếm đúng số lượng, không chỉ test ảnh có 1 vật.
- [ ] D2. Test bằng 1 ảnh có NHIỀU LOẠI linh kiện khác nhau — xác nhận `detections` phân loại đúng từng loại, `summary` nhóm đúng.
- [ ] D3. Test ảnh không có linh kiện nào (ví dụ ảnh trắng) — xác nhận trả về `detections: []`, `summary: []`, không lỗi.
- [ ] D4. Test không gửi ảnh — xác nhận trả về lỗi 400 rõ ràng.
- [ ] D5. Kiểm tra thời gian phản hồi (để biết cần đặt timeout bao nhiêu ở Backend khi nối vào).

## Giai đoạn E — Mapping tên lớp AI ↔ vật tư thật (cần người dùng xác nhận)

- [ ] E1. Đối chiếu 61 tên lớp model với danh mục `items` thật trong database — xác định lớp nào có vật tư tương ứng, lớp nào chưa có (cần tạo thêm vật tư, hoặc bỏ qua).
- [ ] E2. Xác nhận cơ chế mapping đang dùng ở Web/Mobile (bắt buộc người dùng tự chọn vật tư tương ứng khi xác nhận phiếu — đã code sẵn từ Giai đoạn F Web/E Mobile) vẫn hoạt động đúng với tên lớp thật từ model (không phải tên lớp giả của mock).

## Giai đoạn F — Nối vào Backend

- [ ] F1. Sửa `ai.service.js` (Backend): thay đoạn mock bằng gọi HTTP thật sang AI Service (`http://localhost:<port>/detect`), forward ảnh nhận từ client, trả nguyên kết quả về.
- [ ] F2. Xử lý lỗi khi AI Service không phản hồi được (timeout, service chưa chạy) — trả lỗi rõ ràng cho Web/Mobile, không để treo.
- [ ] F3. Cập nhật `.env` Backend với địa chỉ AI Service (`AI_SERVICE_URL`).

## Giai đoạn G — Test end-to-end

- [ ] G1. Test luồng nhập kho AI trên Web từ đầu đến cuối với AI thật (không còn mock).
- [ ] G2. Test luồng chụp ảnh AI trên Mobile (điện thoại thật) từ đầu đến cuối với AI thật.
- [ ] G3. So sánh trải nghiệm với lúc dùng mock — xác nhận không có gì vỡ, cấu trúc dữ liệu vẫn khớp.

## Giai đoạn H — Hoàn thiện

- [ ] H1. Viết `README.md` ngắn cho `ai-service/` — cách cài đặt, cách chạy, ghi rõ nguồn dataset (trích dẫn ElectroCom61) và mã nguồn YOLOv9 fork đã dùng.
- [ ] H2. Cập nhật `07-DECISIONS-LOG.md` lần cuối cho AI Service.
- [ ] H3. Commit + push, merge vào `main` sau khi người dùng xác nhận toàn bộ ổn.

---

**Khi nào coi là xong AI Service:** toàn bộ checkbox đã tick, endpoint `/detect` trả đúng cấu trúc đã chốt, đếm số lượng đúng, test end-to-end trên cả Web lẫn Mobile với model thật không lỗi. Lúc đó dự án coi như hoàn chỉnh cả 4 phần: Database + Backend + Web + Mobile + AI Service.
