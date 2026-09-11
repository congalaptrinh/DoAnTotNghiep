# 05 — AI SERVICE SPEC (Python + FastAPI + YOLO + OpenCV)

> Bối cảnh dự án: `00-OVERVIEW.md`. Backend gọi service này: xem mục 3.7 của `02-BACKEND-SPEC.md`.

## 1. Vai trò

Microservice độc lập, tách biệt hoàn toàn khỏi Backend NodeJS, chuyên nhận ảnh và trả về kết quả nhận diện linh kiện (loại + số lượng) để hỗ trợ nghiệp vụ nhập kho. **AI Service không bao giờ ghi trực tiếp vào database chính** — nó chỉ trả kết quả nhận diện, Backend/người dùng mới là nơi quyết định có cập nhật tồn kho hay không.

## 2. Setup

- Python + FastAPI.
- Model: YOLO (Object Detection) — có thể bắt đầu với model pretrained (ví dụ YOLOv8) để dựng khung luồng, sau đó fine-tune bằng dataset linh kiện điện tử tự gán nhãn (Roboflow hoặc LabelImg).
- OpenCV để tiền xử lý ảnh và vẽ bounding box lên ảnh kết quả.

## 3. API

### `POST /detect`

**Input:** ảnh (multipart/form-data, field `image`).

**Xử lý:**
1. Đọc ảnh, tiền xử lý (resize/normalize) bằng OpenCV.
2. Chạy inference YOLO trên ảnh.
3. Gom kết quả theo từng lớp linh kiện (đếm số lượng mỗi lớp).
4. Vẽ bounding box + nhãn lên ảnh gốc bằng OpenCV → encode ảnh kết quả (base64 hoặc lưu tạm rồi trả URL — chọn 1 cách và dùng nhất quán).

**Output (JSON) — ví dụ cấu trúc:**
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
    "annotated_image": "data:image/jpeg;base64,..."
  }
}
```

> Cấu trúc trên là gợi ý — điều chỉnh field cho khớp với những gì Backend/Frontend cần hiển thị (loại linh kiện, số lượng, độ tin cậy, bounding box, ảnh đã đánh dấu — đây là 5 thứ bắt buộc phải có theo đề cương).

### `GET /health`
Health check đơn giản để Backend/monitoring kiểm tra service còn sống.

## 4. Giao tiếp với Backend

- Backend gọi `POST /detect` khi người dùng upload ảnh qua endpoint `POST /api/ai/detect` (xem `02-BACKEND-SPEC.md` mục 3.7).
- AI Service chỉ trả kết quả, không lưu trạng thái nghiệp vụ — mọi thứ về phiếu nhập, xác nhận, cập nhật tồn kho đều nằm ở Backend.
- Timeout: Backend nên set timeout hợp lý (vài giây) khi gọi AI Service và xử lý lỗi/timeout rõ ràng trả về client.

## 5. Dữ liệu huấn luyện

- Gán nhãn ảnh linh kiện bằng Roboflow hoặc LabelImg.
- Cấu trúc dataset theo chuẩn YOLO (images/ + labels/ dạng txt, hoặc export trực tiếp từ Roboflow).
- Lưu pipeline train riêng (script hoặc notebook) trong `/ai-service/training/`, tách khỏi code phục vụ API.

## 6. Kiểm thử

- Test `/detect` với ảnh có linh kiện rõ ràng — kiểm tra output đúng cấu trúc.
- Test với ảnh không có linh kiện nào — trả `detections: []`, `summary: []` chứ không lỗi.
- Test `/health`.
- Test hiệu năng cơ bản: thời gian phản hồi cho 1 ảnh (để Backend đặt timeout phù hợp).
