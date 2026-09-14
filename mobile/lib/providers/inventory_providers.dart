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

/// Tồn kho theo kho/vị trí của 1 item (D2). `autoDispose` — KHÔNG được cache
/// vô thời hạn như trước (đó là nguyên nhân bug "Chi tiết vật tư không cập
/// nhật sau khi nhập/xuất": `FutureProvider.family` thường sống mãi trong
/// `ProviderContainer` bất kể widget nào đang mở/đóng màn, nên quay lại 1
/// item đã từng xem sẽ luôn thấy DATA CŨ, không tự fetch lại — vào lần đầu
/// xem 1 item khác nhau lại đúng chỉ vì đó là lần fetch ĐẦU TIÊN cho itemId
/// đó). `autoDispose` khiến provider bị huỷ ngay khi không còn màn nào theo
/// dõi (rời màn Chi tiết vật tư) — lần mở lại SAU (kể cả cùng item) luôn
/// fetch mới. Ngoài ra nơi tạo phiếu (`quick_order_form_screen.dart`,
/// `manual_import_screen.dart`, `ai_result_screen.dart`) chủ động
/// `ref.invalidate()` đúng itemId ngay sau khi tạo thành công — xử lý case
/// người dùng KHÔNG rời màn (tạo phiếu ngay tại Chi tiết vật tư rồi quay lại
/// đúng instance màn cũ, autoDispose không giúp được vì màn chưa từng đóng).
final itemInventoryProvider = FutureProvider.family.autoDispose<List<InventoryRow>, String>((ref, itemId) {
  return InventoryService.instance.forItem(itemId);
});
