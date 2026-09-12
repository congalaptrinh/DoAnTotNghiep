import { request } from './apiClient';

export interface AiDetection {
  class_name: string;
  confidence: number;
  bounding_box: { x: number; y: number; width: number; height: number };
}

export interface AiSummary {
  class_name: string;
  count: number;
}

export interface AiDetectResult {
  detections: AiDetection[];
  summary: AiSummary[];
  annotated_image: string;
}

/**
 * `POST /api/ai/detect` — hợp đồng dữ liệu chốt tại 07-DECISIONS-LOG.md (2026-09-11, mục F1).
 * MOCK ở phía Backend: `class_name` là nhãn chung (VD "resistor", "ic_chip"), KHÔNG map thẳng
 * tới 1 `item_id` thật trong danh mục — vì vậy UI bước xác nhận (step 2) bắt buộc người dùng
 * tự chọn vật tư thật tương ứng với mỗi nhóm nhận diện, không được tự suy luận/bịa mapping.
 */
export function detectImage(file: File): Promise<AiDetectResult> {
  const formData = new FormData();
  formData.append('image', file);
  return request<AiDetectResult>({ method: 'POST', url: '/ai/detect', data: formData });
}
