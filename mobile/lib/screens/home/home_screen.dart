import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/order_summary.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../utils/app_theme.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc muốn đăng xuất khỏi tài khoản này?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Huỷ')),
          TextButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Đăng xuất')),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final statsAsync = ref.watch(dashboardStatsProvider);

    return Scaffold(
      appBar: buildBrandAppBar(
        'TechStore WMS',
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Đăng xuất',
            onPressed: () => _confirmLogout(context, ref),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(dashboardStatsProvider.future),
        child: statsAsync.when(
          data: (stats) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Xin chào, ${user?.fullName ?? ''}', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(user?.role.roleName.label ?? '', style: const TextStyle(color: Colors.black54)),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: _StatCard(label: 'Vật tư', value: stats.totalItems, color: AppColors.info)),
                  const SizedBox(width: 12),
                  Expanded(child: _StatCard(label: 'Sắp hết hàng', value: stats.lowStockCount, color: AppColors.warning)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      label: 'Phiếu nhập/xuất chờ xác nhận',
                      value: stats.pendingOrdersCount,
                      color: AppColors.brandFrom,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text('Phiếu gần đây của bạn', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (stats.recentOrders.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text('Chưa có phiếu nào', style: TextStyle(color: Colors.black45)),
                )
              else
                ...stats.recentOrders.map((o) => _RecentOrderTile(order: o)),
            ],
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Lỗi tải dữ liệu: $e')),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final Color color;

  const _StatCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        child: Column(
          children: [
            Text('$value', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 4),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          ],
        ),
      ),
    );
  }
}

class _RecentOrderTile extends StatelessWidget {
  final OrderSummary order;

  const _RecentOrderTile({required this.order});

  String _formatDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(
          order.kind == OrderKind.importOrder ? Icons.call_received : Icons.call_made,
          color: orderStatusColor(order.status),
        ),
        title: Text(order.code),
        subtitle: Text(order.kind == OrderKind.importOrder ? 'Phiếu nhập kho' : 'Phiếu xuất kho'),
        trailing: Text(_formatDate(order.date), style: const TextStyle(color: Colors.black54)),
      ),
    );
  }
}
