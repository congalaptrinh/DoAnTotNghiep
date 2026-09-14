import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/order_summary.dart';
import '../../providers/history_provider.dart';
import '../../utils/app_theme.dart';

/// Giai đoạn F — Lịch sử: toàn bộ phiếu (nhập + xuất) do người dùng hiện tại
/// tạo, mới nhất trước. Icon màu theo LOẠI NGHIỆP VỤ (`movementTypeColor` —
/// đồng bộ với Web), badge trạng thái riêng theo đúng 3 giá trị thật
/// (DRAFT/CONFIRMED/CANCELLED, nhãn nguyên văn khớp Web).
class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(historyProvider);

    return Scaffold(
      appBar: buildBrandAppBar('Lịch sử'),
      body: historyAsync.when(
        data: (orders) => orders.isEmpty
            ? const Center(
                child: Text('Chưa có phiếu nào', style: TextStyle(color: AppColors.textMuted)),
              )
            : RefreshIndicator(
                onRefresh: () => ref.refresh(historyProvider.future),
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.tightGap),
                  itemCount: orders.length,
                  itemBuilder: (context, i) => _HistoryTile(order: orders[i]),
                ),
              ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Lỗi tải dữ liệu: $e', style: const TextStyle(color: AppColors.danger))),
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  final OrderSummary order;

  const _HistoryTile({required this.order});

  String _formatDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  @override
  Widget build(BuildContext context) {
    final movementType = order.kind == OrderKind.importOrder ? 'IMPORT' : 'EXPORT';
    final typeColor = movementTypeColor(movementType);
    final statusColor = orderStatusColor(order.status);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding, vertical: AppSpacing.tightGap),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: CircleAvatar(
          backgroundColor: typeColor.withValues(alpha: 0.15),
          child: Icon(
            order.kind == OrderKind.importOrder ? Icons.call_received : Icons.call_made,
            color: typeColor,
          ),
        ),
        title: Text(order.code, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        subtitle: Text(
          '${order.kind == OrderKind.importOrder ? 'Phiếu nhập kho' : 'Phiếu xuất kho'} · ${_formatDate(order.date)}',
          style: const TextStyle(color: AppColors.textMuted),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            orderStatusLabel(order.status),
            style: TextStyle(color: statusColor, fontWeight: FontWeight.w700, fontSize: 12),
          ),
        ),
      ),
    );
  }
}
