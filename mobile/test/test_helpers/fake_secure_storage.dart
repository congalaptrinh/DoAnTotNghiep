import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

/// flutter_secure_storage gọi xuống native qua MethodChannel thật — không có
/// backend giả lập dưới `flutter test` (không phải widget thật, không có
/// Android/iOS/Windows host). Mock kênh này bằng bộ nhớ tạm để các service
/// dùng SecureStorageService (đọc/ghi JWT) chạy được trong test mà không cần
/// build app thật — chỉ dùng cho test, KHÔNG dùng trong code chạy thật.
const _channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');

void setUpFakeSecureStorage() {
  TestWidgetsFlutterBinding.ensureInitialized();
  // flutter_test tự chặn dart:io HttpClient (luôn trả 400 giả) để tránh test
  // đơn vị lỡ gọi mạng thật — nhưng bài test này CỐ Ý gọi Backend thật (test
  // tích hợp RBAC theo 09-MOBILE-BUILD-CHECKLIST.md), nên phải tắt chặn này.
  HttpOverrides.global = null;
  final store = <String, String>{};

  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(_channel, (call) async {
    switch (call.method) {
      case 'read':
        return store[call.arguments['key']];
      case 'write':
        store[call.arguments['key'] as String] = call.arguments['value'] as String;
        return null;
      case 'delete':
        store.remove(call.arguments['key']);
        return null;
      case 'deleteAll':
        store.clear();
        return null;
      case 'containsKey':
        return store.containsKey(call.arguments['key']);
      case 'readAll':
        return store;
      default:
        return null;
    }
  });
}
