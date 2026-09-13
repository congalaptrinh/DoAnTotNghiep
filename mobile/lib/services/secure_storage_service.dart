import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../utils/constants.dart';

/// Lưu JWT an toàn (tương đương localStorage token bên Web, nhưng mã hoá ở đây
/// vì Mobile không có origin isolation như trình duyệt).
class SecureStorageService {
  SecureStorageService._();
  static final instance = SecureStorageService._();

  final _storage = const FlutterSecureStorage();

  Future<String?> getToken() => _storage.read(key: secureStorageTokenKey);

  Future<void> setToken(String token) =>
      _storage.write(key: secureStorageTokenKey, value: token);

  Future<void> clearToken() => _storage.delete(key: secureStorageTokenKey);
}
