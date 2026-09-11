// ============================================================================
// MOCK — AI Service (Python FastAPI + YOLO) CHƯA TỒN TẠI ở giai đoạn này.
// Hàm này trả dữ liệu giả lập đúng cấu trúc theo specs/05-AI-SERVICE-SPEC.md
// để Backend/Web/Mobile dựng luồng nhập kho bằng AI mà không cần chờ AI Service thật.
//
// TODO (khi AI Service thật sẵn sàng): thay toàn bộ nội dung hàm `detect` bên dưới
// bằng 1 lệnh gọi HTTP POST multipart/form-data tới `${AI_SERVICE_URL}/detect`
// (forward field `image` nguyên trạng), rồi trả thẳng response của AI Service
// (đã đúng cấu trúc {detections, summary, annotated_image}) về cho client — không
// đổi cấu trúc dữ liệu để Web/Mobile không phải sửa lại code đã tích hợp với mock này.
// ============================================================================

const MOCK_DETECTIONS = [
  { class_name: 'resistor', confidence: 0.92, bounding_box: { x: 120, y: 80, width: 40, height: 25 } },
  { class_name: 'resistor', confidence: 0.89, bounding_box: { x: 200, y: 80, width: 38, height: 24 } },
  { class_name: 'resistor', confidence: 0.95, bounding_box: { x: 280, y: 85, width: 42, height: 26 } },
  { class_name: 'resistor', confidence: 0.87, bounding_box: { x: 360, y: 90, width: 39, height: 25 } },
  { class_name: 'resistor', confidence: 0.91, bounding_box: { x: 440, y: 82, width: 41, height: 24 } },
  { class_name: 'ic_chip', confidence: 0.97, bounding_box: { x: 150, y: 200, width: 80, height: 60 } },
  { class_name: 'ic_chip', confidence: 0.93, bounding_box: { x: 300, y: 210, width: 78, height: 58 } },
];

function buildSummary(detections) {
  const counts = {};
  for (const d of detections) {
    counts[d.class_name] = (counts[d.class_name] || 0) + 1;
  }
  return Object.entries(counts).map(([class_name, count]) => ({ class_name, count }));
}

// MOCK: trả cố định danh sách detections mẫu (không thật sự phân tích ảnh đầu vào).
// annotated_image = chính ảnh người dùng upload, encode lại base64 (KHÔNG vẽ bounding box thật,
// vì chưa có OpenCV/YOLO ở bước mock này) — chỉ để đúng field, đúng format data URI.
async function detect(fileBuffer, mimeType) {
  const detections = MOCK_DETECTIONS;
  const summary = buildSummary(detections);
  const annotated_image = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

  return { detections, summary, annotated_image };
}

module.exports = { detect };
