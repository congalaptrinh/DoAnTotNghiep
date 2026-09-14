import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order_summary.dart';
import '../services/order_service.dart';
import 'auth_provider.dart';

/// Giai đoạn F — toàn bộ phiếu (mọi trạng thái) do người dùng hiện tại tạo,
/// mới nhất trước. Khác `dashboardStatsProvider.recentOrders` (chỉ lấy 5 dòng
/// xem nhanh ở Trang chủ) — màn này lấy ĐẦY ĐỦ, không giới hạn.
final historyProvider = FutureProvider<List<OrderSummary>>((ref) async {
  final userId = ref.watch(authProvider).user?.userId;

  final (allImport, allExport) = await (
    OrderService.instance.listImport(),
    OrderService.instance.listExport(),
  ).wait;

  final mine = [...allImport, ...allExport]
      .where((o) => userId != null && o.createdByUserId == userId)
      .toList()
    ..sort((a, b) => b.date.compareTo(a.date));

  return mine;
});
