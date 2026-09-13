import '../models/user.dart';
import 'api_client.dart';

class LoginResult {
  final String token;
  final AuthUser user;
  LoginResult({required this.token, required this.user});
}

/// Gọi đúng 2 endpoint thật của Backend (xem `web/src/services/auth.service.ts`
/// — cùng 1 bộ API dùng chung cho Web + Mobile).
class AuthService {
  AuthService._();
  static final instance = AuthService._();

  Future<LoginResult> login(String email, String password) async {
    final data = await ApiClient.instance.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return LoginResult(
      token: data['token'] as String,
      user: AuthUser.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  Future<AuthUser> getMe() async {
    final data = await ApiClient.instance.get<Map<String, dynamic>>('/auth/me');
    return AuthUser.fromJson(data);
  }
}
