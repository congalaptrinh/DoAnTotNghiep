import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order_summary.dart';
import '../services/inventory_service.dart';
import '../services/item_service.dart';
import '../services/order_service.dart';
import 'auth_provider.dart';

class DashboardStats {
  final int totalItems;
  final int lowStockCount;
  final int pendingOrdersCount;
  final List<OrderSummary> recentOrders;

  DashboardStats({
    required this.totalItems,
    required this.lowStockCount,
    required this.pendingOrdersCount,
    required this.recentOrders,
  });
}

/// Số liệu Trang chủ (C2) — gộp từ nhiều lời gọi API như Web
/// (`useDashboardStats.ts`), Backend không có endpoint tổng hợp riêng.
final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final userId = ref.watch(authProvider).user?.userId;

  final (items, inventory, pendingImport, pendingExport, allImport, allExport) = await (
    ItemService.instance.list(),
    InventoryService.instance.list(),
    OrderService.instance.listImport(status: 'DRAFT'),
    OrderService.instance.listExport(status: 'DRAFT'),
    OrderService.instance.listImport(),
    OrderService.instance.listExport(),
  ).wait;

  final stockByItem = <String, num>{};
  for (final row in inventory) {
    stockByItem[row.itemId] = (stockByItem[row.itemId] ?? 0) + row.availableQuantity;
  }
  final lowStockCount = items.where((i) => (stockByItem[i.itemId] ?? 0) <= i.minStock).length;

  final recentOrders = [...allImport, ...allExport]
      .where((o) => userId != null && o.createdByUserId == userId)
      .toList()
    ..sort((a, b) => b.date.compareTo(a.date));

  return DashboardStats(
    totalItems: items.length,
    lowStockCount: lowStockCount,
    pendingOrdersCount: pendingImport.length + pendingExport.length,
    recentOrders: recentOrders.take(5).toList(),
  );
});
