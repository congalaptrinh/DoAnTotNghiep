import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/auth_provider.dart';
import 'router.dart';
import 'services/api_client.dart';
import 'utils/app_theme.dart';

void main() {
  // Tạo container thủ công (thay vì để ProviderScope tự tạo) để có thể đăng
  // ký handler 401 TRƯỚC khi UI dựng lên — B4: token hết hạn/401 bất kỳ lúc
  // nào cũng phải tự đăng xuất + quay về màn Đăng nhập, kể cả khi lỗi xảy ra
  // ở 1 lời gọi API xa màn Login (ví dụ giữa lúc tạo phiếu nhập ở Giai đoạn D/E).
  final container = ProviderContainer();
  ApiClient.instance.setUnauthorizedHandler(() {
    container.read(authProvider.notifier).logout();
  });

  runApp(UncontrolledProviderScope(container: container, child: const WmsApp()));
}

class WmsApp extends ConsumerWidget {
  const WmsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);
    return MaterialApp.router(
      title: 'TechStore WMS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
