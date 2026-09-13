import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/inventory_row.dart';
import '../models/item.dart';
import '../services/inventory_service.dart';
import '../services/item_service.dart';

/// Từ khoá tìm kiếm ở D1 (StateProvider để widget cập nhật trực tiếp, có debounce
/// riêng ở tầng UI — xem `inventory_list_screen.dart`).
final itemSearchQueryProvider = StateProvider<String>((ref) => '');

/// Danh sách vật tư D1 kèm tổng tồn kho khả dụng — join client-side giữa
/// `GET /items` và `GET /inventory` (giống cách Web tính "current stock").
final itemsWithStockProvider = FutureProvider<List<(Item, num)>>((ref) async {
  final search = ref.watch(itemSearchQueryProvider);
  final (items, inventory) = await (
    ItemService.instance.list(search: search),
    InventoryService.instance.list(),
  ).wait;

  final stockByItem = <String, num>{};
  for (final row in inventory) {
    stockByItem[row.itemId] = (stockByItem[row.itemId] ?? 0) + row.availableQuantity;
  }
  return [for (final item in items) (item, stockByItem[item.itemId] ?? 0)];
});

/// Tồn kho theo kho/vị trí của 1 item (D2).
final itemInventoryProvider = FutureProvider.family<List<InventoryRow>, String>((ref, itemId) {
  return InventoryService.instance.forItem(itemId);
});
