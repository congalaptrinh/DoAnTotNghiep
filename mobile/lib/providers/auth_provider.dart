import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/secure_storage_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final AuthUser? user;

  const AuthState({required this.status, this.user});
  const AuthState.unknown() : this(status: AuthStatus.unknown);

  bool get isAuthenticated => status == AuthStatus.authenticated;
}

/// Provider trung tâm cho phiên đăng nhập — tương đương AuthContext bên Web.
/// - `build()` tự bootstrap: nếu đã có JWT lưu sẵn (lần mở app trước), gọi
///   `GET /auth/me` để khôi phục phiên; JWT hỏng/hết hạn -> xoá + coi như chưa
///   đăng nhập (không throw ra UI).
/// - `logout()` cũng được ApiClient gọi khi gặp 401 (xem `main.dart` — nơi
///   đăng ký `ApiClient.instance.setUnauthorizedHandler`).
class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    _bootstrap();
    return const AuthState.unknown();
  }

  Future<void> _bootstrap() async {
    final token = await SecureStorageService.instance.getToken();
    if (token == null || token.isEmpty) {
      state = const AuthState(status: AuthStatus.unauthenticated);
      return;
    }
    try {
      final user = await AuthService.instance.getMe();
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } catch (_) {
      await SecureStorageService.instance.clearToken();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login(String email, String password) async {
    final result = await AuthService.instance.login(email, password);
    await SecureStorageService.instance.setToken(result.token);
    state = AuthState(status: AuthStatus.authenticated, user: result.user);
  }

  Future<void> logout() async {
    await SecureStorageService.instance.clearToken();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
