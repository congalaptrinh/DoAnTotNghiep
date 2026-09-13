import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home_placeholder_screen.dart';

/// Router phụ thuộc trực tiếp vào authProvider — mỗi khi trạng thái đăng nhập
/// đổi (login/logout/401 tự động), Provider này rebuild -> GoRouter mới ->
/// `redirect` chạy lại ngay. Đánh đổi: mất lịch sử điều hướng khi đổi trạng
/// thái đăng nhập — chấp nhận được vì login/logout vốn là điểm reset toàn bộ
/// UI (xem quyết định trong 07-DECISIONS-LOG.md, Giai đoạn B).
final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login';

      // Đang bootstrap (kiểm tra token cũ) — chưa biết đăng nhập hay chưa, đứng yên.
      if (authState.status == AuthStatus.unknown) return null;

      if (!authState.isAuthenticated) return loggingIn ? null : '/login';
      if (authState.isAuthenticated && loggingIn) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomePlaceholderScreen()),
    ],
  );
});
