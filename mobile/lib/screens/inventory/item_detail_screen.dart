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
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.itemCode, style: const TextStyle(color: Colors.black54)),
                Text('Đơn vị: ${item.unit}'),
              ],
            ),
          ),
          Expanded(
            child: rowsAsync.when(
              data: (rows) => rows.isEmpty
                  ? const Center(child: Text('Chưa có tồn kho tại kho/vị trí nào'))
                  : ListView.builder(
                      itemCount: rows.length,
                      itemBuilder: (context, i) {
                        final r = rows[i];
                        return ListTile(
                          title: Text(r.warehouse?.warehouseName ?? r.warehouseId),
                          subtitle: Text('Vị trí: ${r.location?.locationCode ?? r.locationId}'),
                          trailing: Text('${r.availableQuantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        );
                      },
                    ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Lỗi tải dữ liệu: $e')),
            ),
          ),
          if (canImport || canExport)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (canImport)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _openQuickOrder(context, OrderKind.importOrder),
                        child: const Text('Tạo phiếu nhập nhanh'),
                      ),
                    ),
                  if (canImport && canExport) const SizedBox(width: 12),
                  if (canExport)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _openQuickOrder(context, OrderKind.exportOrder),
                        child: const Text('Tạo phiếu xuất nhanh'),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _openQuickOrder(BuildContext context, OrderKind kind) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => QuickOrderFormScreen(item: item, kind: kind)),
    );
  }
}
