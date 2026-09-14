import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/item.dart';
import '../../models/order_summary.dart';
import '../../providers/auth_provider.dart';
import '../../providers/inventory_providers.dart';
import '../../utils/app_theme.dart';
import '../../utils/permissions.dart';
import 'quick_order_form_screen.dart';

class ItemDetailScreen extends ConsumerWidget {
  final Item item;

  const ItemDetailScreen({super.key, required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authProvider).user?.role.roleName;
    final rowsAsync = ref.watch(itemInventoryProvider(item.itemId));
    final canImport = canWrite(role, MobileWritableResource.importOrders);
    final canExport = canWrite(role, MobileWritableResource.exportOrders);

    return Scaffold(
      appBar: buildBrandAppBar(item.itemName),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.screenPadding),
            color: AppColors.surface,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.itemCode, style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w500)),
                const SizedBox(height: AppSpacing.tightGap),
                Text('Đơn vị: ${item.unit}', style: const TextStyle(color: AppColors.textBody)),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: RefreshIndicator(
              // Kéo để làm mới — bắt buộc có vì tồn kho có thể đổi từ nơi khác
              // (Web, luồng AI, Nhập kho thủ công) trong lúc đang đứng ở màn này.
              onRefresh: () => ref.refresh(itemInventoryProvider(item.itemId).future),
              child: rowsAsync.when(
                data: (rows) => rows.isEmpty
                    ? ListView(
                        children: const [
                          Padding(
                            padding: EdgeInsets.only(top: 80),
                            child: Center(
                              child: Text('Chưa có tồn kho tại kho/vị trí nào', style: TextStyle(color: AppColors.textMuted)),
                            ),
                          ),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.tightGap),
                        itemCount: rows.length,
                        itemBuilder: (context, i) {
                          final r = rows[i];
                          return Card(
                            margin: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.screenPadding,
                              vertical: AppSpacing.tightGap,
                            ),
                            child: ListTile(
                              leading: const Icon(Icons.warehouse_outlined, color: AppColors.brandFrom),
                              title: Text(
                                r.warehouse?.warehouseName ?? r.warehouseId,
                                style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                              ),
                              subtitle: Text(
                                'Vị trí: ${r.location?.locationCode ?? r.locationId}',
                                style: const TextStyle(color: AppColors.textMuted),
                              ),
                              trailing: Text(
                                '${r.availableQuantity}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary),
                              ),
                            ),
                          );
                        },
                      ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Lỗi tải dữ liệu: $e', style: const TextStyle(color: AppColors.danger))),
              ),
            ),
          ),
          if (canImport || canExport)
            Container(
              padding: const EdgeInsets.all(AppSpacing.screenPadding),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  if (canImport)
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.info),
                        onPressed: () => _openQuickOrder(context, ref, OrderKind.importOrder),
                        icon: const Icon(Icons.call_received, size: 18),
                        label: const Text('Nhập nhanh'),
                      ),
                    ),
                  if (canImport && canExport) const SizedBox(width: AppSpacing.itemGap),
                  if (canExport)
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
                        onPressed: () => _openQuickOrder(context, ref, OrderKind.exportOrder),
                        icon: const Icon(Icons.call_made, size: 18),
                        label: const Text('Xuất nhanh'),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _openQuickOrder(BuildContext context, WidgetRef ref, OrderKind kind) async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => QuickOrderFormScreen(item: item, kind: kind)),
    );
    // Phòng hờ — QuickOrderFormScreen tự invalidate provider của chính nó khi
    // tạo thành công, nhưng invalidate lại đây (không hại gì, đã autoDispose)
    // để chắc chắn màn Chi tiết vật tư luôn mới ngay khi quay lại, kể cả nếu
    // sau này có đường tạo phiếu nào khác quên gọi invalidate.
    if (created == true) {
      ref.invalidate(itemInventoryProvider(item.itemId));
    }
  }
}
