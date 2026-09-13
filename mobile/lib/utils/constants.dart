import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

/// Base URL của Backend thật (NodeJS + Express, xem 02-BACKEND-SPEC.md).
/// Mobile App gọi CÙNG bộ REST API với Web — không có API riêng.
///
/// Mặc định theo nền tảng đang chạy (đều trỏ về Backend chạy local port 5000):
/// - Web (Chrome, dùng để demo theo quyết định A1): `localhost` dùng được thẳng.
/// - Android (emulator): `10.0.2.2` là bí danh loopback-host chuẩn của Android
///   emulator, do "localhost" bên trong emulator trỏ vào chính con máy ảo.
/// - Thiết bị Android thật / iOS thật: cần đổi thành địa chỉ LAN của máy chạy
///   Backend (ví dụ 192.168.x.x) — truyền qua `--dart-define=API_BASE_URL=...`
///   lúc `flutter run`/`flutter build`, xem README trong mobile/.
String get _defaultApiBaseUrl {
  if (kIsWeb) return 'http://localhost:5000/api';
  if (Platform.isAndroid) return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}

const _apiBaseUrlOverride = String.fromEnvironment('API_BASE_URL');

final String apiBaseUrl =
    _apiBaseUrlOverride.isNotEmpty ? _apiBaseUrlOverride : _defaultApiBaseUrl;

const secureStorageTokenKey = 'wms.token';
