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

  // Đếm theo TỪNG DÒNG tồn kho (mỗi kho/vị trí riêng biệt), giống hệt Web
  // (`useDashboardStats.ts` dòng 77: `row.available_quantity <= row.item.min_stock`)
  // — KHÔNG cộng dồn theo item trước khi so sánh, nếu không sẽ ra số khác Web
  // (vd 1 item tồn 8+8 ở 2 vị trí, min_stock=10: Web đếm 2 dòng sắp hết hàng,
  // cộng dồn trước sẽ ra tổng 16 > 10 và bị tính nhầm là KHÔNG sắp hết hàng).
  final minStockByItem = {for (final i in items) i.itemId: i.minStock};
  final lowStockCount = inventory.where((row) {
    final minStock = minStockByItem[row.itemId];
    return minStock != null && row.availableQuantity <= minStock;
  }).length;

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
