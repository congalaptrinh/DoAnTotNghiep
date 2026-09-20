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

- [x] B1. Setup project Python: venv (Python 3.11.9, cài mới bằng winget vì máy chưa có Python thật). **Đổi khác checklist gốc**: KHÔNG dùng package `ultralytics` — checkpoint `best.pt` train bằng mã nguồn fork `SkalskiP/yolov9` (không phải `ultralytics` tích hợp sẵn), `ultralytics.YOLO('models/best.pt')` báo lỗi thẳng "NOT forwards compatible" (pickle checkpoint tham chiếu class `models.yolo.DetectionModel` của repo gốc, không tồn tại trong package `ultralytics`). Đã vendor mã nguồn gốc vào `ai-service/yolov9_src/` (đã bỏ `.git` lồng bên trong) và dùng thẳng code đó (`models.common.DetectMultiBackend`, `utils.*`) để load + infer. `requirements.txt` cập nhật lại theo nhu cầu thật của `yolov9_src/` (bỏ `ultralytics`, thêm `torch`/`torchvision`/`pandas`/`seaborn`/`tqdm`/`ipython`/`scipy`/`pyyaml`/`requests`/`matplotlib`/`psutil`/`setuptools<81`). Chi tiết đầy đủ + lý do: `07-DECISIONS-LOG.md`.
- [x] B2. `GET /health` — trả `{success, data: {status, model_loaded}}`. Test thật: `curl http://127.0.0.1:8001/health` → `{"success":true,"data":{"status":"ok","model_loaded":true}}`.
- [x] B3. Load model 1 lần lúc `@app.on_event("startup")` bằng `DetectMultiBackend` (`yolov9_src/models/common.py`) — không load lại mỗi request. Phải vá thêm `yolov9_src/models/experimental.py` (`attempt_load`): thêm `weights_only=False` cho `torch.load` vì PyTorch 2.6+ đổi mặc định `weights_only=True`, chặn unpickle class model tuỳ biến — an toàn vì đây là checkpoint tự huấn luyện (nguồn tin cậy).
- [x] B4. Liệt kê đủ 61 lớp qua `GET /classes` (test thật, xem danh sách đầy đủ trong `07-DECISIONS-LOG.md` — đã đối chiếu sơ bộ bằng mắt: phần lớn là tên linh kiện/module cụ thể theo chuẩn ElectroCom61, ví dụ `Resistor`, `IC-Chip`, `Arduino-Uno`, `ESP32`, nhiều loại tụ/cảm biến/module — việc đối chiếu chi tiết với danh mục `items` thật trong DB để lại cho Giai đoạn E như checklist gốc quy định).

## Giai đoạn C — Endpoint /detect (phần quan trọng nhất)

- [x] C1. `POST /detect` nhận `multipart/form-data` field `image`. Thiếu field hẳn HOẶC file rỗng đều trả 400 rõ ràng (xem D4 — có 1 bug đã sửa ở đây).
- [x] C2. Inference bằng `DetectMultiBackend` + tiền xử lý `letterbox` + hậu xử lý `non_max_suppression` + `scale_boxes` (đúng pipeline gốc của `yolov9_src/detect.py`) — lấy `class_name`, `confidence`, toạ độ box cho từng object.
- [x] C3. `detections`: mảng `{class_name, confidence, bounding_box: {x, y, width, height}}` — đúng cấu trúc đã chốt.
- [x] C4. `summary`: nhóm theo `class_name`, đếm số lượng — đã test thật với ảnh nhiều vật cùng loại lẫn khác loại (xem D1/D2), đếm đúng số lượng object model tìm thấy (KHÔNG bỏ sót object nào, dù độ chính xác phân loại của model là vấn đề riêng — xem ghi chú D1-D3).
- [x] C5. Vẽ bounding box + nhãn bằng `utils.plots.Annotator` (OpenCV bên trong), encode base64 `data:image/jpeg;base64,...` — test thật, xem ảnh minh chứng `ai-service/test_images/d1_annotated.jpg`, `d2_annotated.jpg` (box khớp chính xác từng vật thể trong ảnh gốc).
- [x] C6. JSON trả về đúng khung đã chốt `{success, data: {detections, summary, annotated_image}, message}` — đối chiếu trực tiếp với `backend/src/services/ai.service.js` (bản mock), khớp 100% field.

## Giai đoạn D — Test độc lập (chưa nối Backend)

- [x] D1. Ảnh 6 điện trở cùng loại (`test_images/resistors_multi.jpg`, ảnh thật tải từ Wikimedia Commons — không phải ảnh dataset train) — **kết quả: chỉ 1 detection duy nhất, độ tin cậy thấp (0.27), bị phân loại SAI thành "1-5-Volt-Battery"** (không phải "Resistor"). Đã điều tra kỹ bằng script riêng hạ ngưỡng tin cậy xuống 0.01 để xem toàn bộ ứng viên thô — lớp "Resistor" KHÔNG xuất hiện ở bất kỳ ngưỡng nào, xác nhận đây là hạn chế thật của model (model không nhận ra điện trở trong ảnh sản phẩm nền trắng studio này) chứ không phải bug pipeline — bounding box vẽ ra vẫn khớp chính xác vị trí 1 điện trở thật trong ảnh (xem `d1_annotated.jpg`), chứng minh phần code (tiền xử lý/hậu xử lý/vẽ box) hoạt động đúng, vấn đề nằm ở độ chính xác phân loại của model trên ảnh khác phong cách chụp so với dataset train (ElectroCom61).
- [x] D2. Ảnh nhiều loại linh kiện khác nhau (`test_images/ic_multi.jpg`: IC DIP + nhiều transistor dạng TO-220, ảnh thật từ Wikimedia Commons) — **kết quả: 9 detections, box định vị chính xác từng vật thể thật** (xem `d2_annotated.jpg`) nhưng nhãn phân loại có đúng có sai: 7 gói TO-220 → "IGBT" (nhầm nhưng cùng họ gói linh kiện, hợp lý), 1 IC DIP → "Arduino-Uno" (sai), 1 transistor nhỏ → "Soil-Moisture-Sensor" (sai). `summary` nhóm/đếm đúng số lượng model tìm thấy (7+1+1=9, khớp `detections.length`).
- [x] D3. Ảnh trắng trơn 640×480 tự tạo — không lỗi (đúng 1 phần yêu cầu), NHƯNG model báo 1 false positive "Breadboard" (conf 0.38) phủ gần hết ảnh thay vì trả rỗng như kỳ vọng — cùng loại vấn đề với D1/D2 (độ chính xác model trên input ngoài phân bố dữ liệu train), không phải lỗi service.
- [x] D4. Không gửi field `image` — **phát hiện bug thật**: FastAPI tự chặn bằng `422` (thông báo mặc định tiếng Anh) trước khi vào tới code của mình, do khai báo tham số bắt buộc `File(...)`. **Đã sửa**: đổi thành `Optional[UploadFile] = File(None)` + tự kiểm tra `None` để luôn trả `400` với thông điệp tiếng Việt nhất quán (giống Backend mock) dù thiếu hẳn field hay field rỗng. Test lại sau khi sửa: `curl -X POST .../detect` (không kèm ảnh) → `400 {"detail":"Vui long chon anh de nhan dien (field \"image\")"}`.
- [x] D5. Thời gian phản hồi thực đo trên CPU (máy dev, không có GPU): ~1.5–2.2 giây/ảnh (kích thước ảnh test ~640-960px, model YOLOv9-c 51M tham số). Ghi chú cho Giai đoạn F: Backend nên đặt timeout tối thiểu **10 giây** để có biên an toàn (ảnh thực tế từ điện thoại có thể lớn hơn/máy chạy AI Service có thể yếu hơn máy dev).

> **Lưu ý quan trọng trước khi làm Giai đoạn E**: pipeline kỹ thuật (nhận ảnh → inference → gom nhóm/đếm → vẽ box → trả JSON đúng cấu trúc) đã CHẠY ĐÚNG và được test thật đầy đủ (C1-C6, D1-D5). Vấn đề còn lại là ĐỘ CHÍNH XÁC PHÂN LOẠI của bản thân model trên ảnh chụp không giống phong cách dataset ElectroCom61 (ảnh sản phẩm studio nền trắng) — đây là giới hạn của model đã huấn luyện, cần người dùng xem xét trước khi quyết định hướng đi Giai đoạn E (có thể cần chụp ảnh test theo đúng điều kiện gần với dataset train hơn để đánh giá công bằng hơn, hoặc chấp nhận đây là hạn chế đã biết để ghi vào báo cáo đồ án).

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
