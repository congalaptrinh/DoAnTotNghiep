// AI Service that (Python FastAPI + YOLOv9, xem ai-service/app/main.py) — thay
// ban mock truoc do (giu nguyen cau truc JSON {detections, summary,
// annotated_image} da chot trong specs/05-AI-SERVICE-SPEC.md, Web/Mobile
// khong can sua gi). Forward nguyen field `image` (multipart) sang
// `${AI_SERVICE_URL}/detect`, tra thang response.data ve cho controller.

const ApiError = require('../utils/ApiError');

const DETECT_TIMEOUT_MS = 10_000; // xem specs/10-AI-BUILD-CHECKLIST.md D5: AI Service that ~2-2.6s/anh tren CPU, dat 10s de co bien an toan

async function detect(fileBuffer, mimeType) {
  const aiServiceUrl = process.env.AI_SERVICE_URL;
  if (!aiServiceUrl) {
    throw new ApiError(500, 'Chưa cấu hình AI_SERVICE_URL trên Backend');
  }

  const form = new FormData();
  form.append('image', new Blob([fileBuffer], { type: mimeType }), 'image');

  let response;
  try {
    response = await fetch(`${aiServiceUrl}/detect`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(DETECT_TIMEOUT_MS),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new ApiError(504, 'AI Service phản hồi quá chậm, vui lòng thử lại');
    }
    throw new ApiError(502, 'Không kết nối được tới AI Service');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status === 400 ? 400 : 502, body?.detail || 'AI Service báo lỗi khi nhận diện ảnh');
  }

  return body.data;
}

module.exports = { detect };
