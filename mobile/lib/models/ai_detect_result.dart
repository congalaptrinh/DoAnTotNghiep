/// Khớp CHÍNH XÁC hợp đồng dữ liệu đã CHỐT CỨNG ở `specs/07-DECISIONS-LOG.md`
/// (mục F1) cho `POST /api/ai/detect` — dùng chung với Web, xem
/// `web/src/services/ai.service.ts`. `bounding_box` là toạ độ PIXEL trên ảnh
/// gốc (không phải phần trăm) — Mobile tự quy đổi ra % khi vẽ overlay.
class BoundingBox {
  final num x;
  final num y;
  final num width;
  final num height;

  BoundingBox({required this.x, required this.y, required this.width, required this.height});

  factory BoundingBox.fromJson(Map<String, dynamic> json) => BoundingBox(
        x: json['x'] as num,
        y: json['y'] as num,
        width: json['width'] as num,
        height: json['height'] as num,
      );
}

class AiDetection {
  final String className;
  final num confidence;
  final BoundingBox boundingBox;

  AiDetection({required this.className, required this.confidence, required this.boundingBox});

  factory AiDetection.fromJson(Map<String, dynamic> json) => AiDetection(
        className: json['class_name'] as String,
        confidence: json['confidence'] as num,
        boundingBox: BoundingBox.fromJson(json['bounding_box'] as Map<String, dynamic>),
      );
}

class AiSummary {
  final String className;
  final int count;

  AiSummary({required this.className, required this.count});

  factory AiSummary.fromJson(Map<String, dynamic> json) => AiSummary(
        className: json['class_name'] as String,
        count: json['count'] as int,
      );
}

class AiDetectResult {
  final List<AiDetection> detections;
  final List<AiSummary> summary;

  /// Data URI đầy đủ (`data:image/<mime>;base64,...`) — render thẳng, không tải thêm.
  final String annotatedImage;

  AiDetectResult({required this.detections, required this.summary, required this.annotatedImage});

  factory AiDetectResult.fromJson(Map<String, dynamic> json) => AiDetectResult(
        detections: (json['detections'] as List<dynamic>)
            .map((e) => AiDetection.fromJson(e as Map<String, dynamic>))
            .toList(),
        summary: (json['summary'] as List<dynamic>).map((e) => AiSummary.fromJson(e as Map<String, dynamic>)).toList(),
        annotatedImage: json['annotated_image'] as String,
      );
}
