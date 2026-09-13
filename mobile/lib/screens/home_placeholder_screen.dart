import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../utils/app_theme.dart';
import '../utils/permissions.dart';

/// Màn tạm thời để xác nhận Giai đoạn B chạy được đầu-cuối (đăng nhập → xem
/// thông tin tài khoản/vai trò → đăng xuất). Sẽ bị THAY THẾ hoàn toàn bởi
/// Bottom Navigation 4 tab thật ở Giai đoạn C (C1/C2) — không xây thêm tính
/// năng ở màn này.
class HomePlaceholderScreen extends ConsumerWidget {
  const HomePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('TechStore WMS')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, color: AppColors.success, size: 48),
              const SizedBox(height: 16),
              Text(
                'Đăng nhập thành công',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              if (user != null) ...[
                Text(user.fullName, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(user.email, style: const TextStyle(color: Colors.black54)),
                const SizedBox(height: 4),
                Chip(label: Text(user.role.roleName.label)),
                const SizedBox(height: 4),
                Text(
                  canWrite(user.role.roleName, MobileWritableResource.importOrders)
                      ? 'Có quyền tạo phiếu nhập/xuất/quét AI'
                      : 'Chỉ xem (không có quyền tạo phiếu)',
                  style: const TextStyle(fontSize: 12, color: Colors.black45),
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => ref.read(authProvider.notifier).logout(),
                child: const Text('Đăng xuất'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
