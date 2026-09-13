import 'dart:io';

import 'package:dio/dio.dart';

import '../models/ai_detect_result.dart';
import 'api_client.dart';

class AiService {
  AiService._();
  static final instance = AiService._();

  /// `POST /api/ai/detect` — field multipart bắt buộc tên `image` (đã CHỐT CỨNG,
  /// xem 07-DECISIONS-LOG.md). Giới hạn 10MB ở Backend (Multer).
  Future<AiDetectResult> detect(File imageFile) async {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(imageFile.path, filename: imageFile.path.split(Platform.pathSeparator).last),
    });
    final data = await ApiClient.instance.post<Map<String, dynamic>>('/ai/detect', data: formData);
    return AiDetectResult.fromJson(data);
  }
}
