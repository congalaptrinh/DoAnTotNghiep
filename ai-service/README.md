# AI Service — nhận diện linh kiện điện tử (TechStore WMS)

Microservice Python (FastAPI) nhận ảnh, chạy YOLOv9 và trả về loại + số lượng linh kiện. Chỉ trả kết quả nhận diện — **không ghi database**; Backend (`../backend`) gọi service này qua `POST /detect` (xem `backend/src/services/ai.service.js`).

## Cài đặt

Yêu cầu: Python 3.11 (đã test 3.11.9), CPU là đủ (GPU không bắt buộc).

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate          # Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt` cố tình **không** dùng package `ultralytics`: model được train bằng mã nguồn fork YOLOv9 nên checkpoint chỉ đọc được bằng chính mã đó, đã đưa sẵn vào `yolov9_src/` (xem mục Nguồn gốc).

## Chạy

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

**Tự khởi động**: `npm run dev`/`npm start` của backend và `npm run dev` của web tự chạy `ensure-running.js` (khởi động AI Service nền nếu chưa chạy, log ở `ai-service/ai-service.log`). App Mobile gọi qua Backend nên chỉ cần Backend chạy. Hoặc bấm đúp `start.bat` (tự dùng venv). **AI Service phải đang chạy thì "Nhập kho bằng AI" mới hoạt động** — nếu tắt terminal/khởi động lại máy, Backend sẽ báo "Không kết nối được tới AI Service" cho tới khi chạy lại.

Backend đọc địa chỉ này từ biến `AI_SERVICE_URL` (mặc định `http://localhost:8001`, xem `backend/.env.example`). Lần khởi động đầu mất vài giây để nạp model (`models/best.pt`).

| Endpoint | Mô tả |
|---|---|
| `GET /health` | `{success, data: {status, model_loaded}}` |
| `GET /classes` | 61 tên lớp model nhận diện được |
| `POST /detect` | `multipart/form-data`, field `image`. Thiếu/rỗng/không phải ảnh → `400` |

Kết quả `/detect` (hợp đồng dữ liệu với Backend/Web/Mobile — **không đổi field**):

```json
{ "success": true,
  "data": {
    "detections": [{ "class_name": "Resistor", "confidence": 0.94,
                     "bounding_box": { "x": 120, "y": 80, "width": 40, "height": 25 } }],
    "summary": [{ "class_name": "Resistor", "count": 3 }],
    "annotated_image": "data:image/jpeg;base64,..." },
  "message": "Nhan dien thanh cong" }
```

Ngưỡng tin cậy 0.25, NMS IoU 0.45, ảnh được resize về 640px. Thời gian phản hồi khoảng 2–2,6 giây/ảnh trên CPU (Backend đặt timeout 10 giây).

## Kiểm thử / đánh giá model

```bash
python compare_models.py                       # so model cũ/mới trên ảnh Wikimedia + 6 ảnh valid/
python compare_phone.py test_images/phone_real_g2.jpg   # so 2 model trên ảnh chụp điện thoại thật
python eval_split.py <thư mục split có images/ và labels/>   # chấm điểm cả 1 tập có nhãn (IoU ≥ 0.5)
```

Các script trên cần model cũ `models/best_v1_2071img.pt` (không đưa vào git vì nặng ~99MB; có thể bỏ qua nếu không cần so sánh). `test_images/` chứa ảnh mẫu dùng cho test; `test_images/electrocom_valid/` là 6 ảnh lấy từ tập `valid/` của ElectroCom61 kèm nhãn.

## Nguồn gốc & trích dẫn

- **Dataset**: *ElectroCom61 — A Multiclass Dataset for Detection of Electronic Components* (61 lớp, ~2071 ảnh gốc), giấy phép **CC BY 4.0**. Nguồn: https://github.com/faiyazabdullah/ElectroCom61 (bản Mendeley Data / Roboflow: https://universe.roboflow.com/datasetsynthesis/electrocom-61). Cần trích dẫn bài báo/dataset gốc của tác giả trong báo cáo đồ án.
- **Kiến trúc**: YOLOv9 — Wang, Yeh, Liao, *YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information*, 2024 (https://arxiv.org/abs/2402.13616).
- **Mã nguồn huấn luyện/suy luận** (`yolov9_src/`, đã lược bỏ lịch sử git): fork https://github.com/SkalskiP/yolov9 của https://github.com/WongKinYiu/yolov9 (giấy phép theo repo gốc). Một chỉnh sửa duy nhất: `models/experimental.py` thêm `weights_only=False` khi `torch.load` (PyTorch ≥ 2.6 mặc định chặn unpickle class tuỳ biến; an toàn vì checkpoint do chính nhóm huấn luyện).
- Huấn luyện: Google Colab (GPU T4), fine-tune `gelan-c`/YOLOv9-c.

Lịch sử quyết định, kết quả test và so sánh các phiên bản model: `../specs/07-DECISIONS-LOG.md`, `../specs/10-AI-BUILD-CHECKLIST.md`.
