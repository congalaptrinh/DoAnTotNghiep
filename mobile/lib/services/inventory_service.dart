import '../models/inventory_row.dart';
import 'api_client.dart';

class InventoryService {
  InventoryService._();
  static final instance = InventoryService._();

  /// Toàn bộ tồn kho (mọi kho/vị trí) — dùng để tính tổng tồn theo item ở D1
  /// và số vật tư sắp hết hàng ở Trang chủ. Giống cách Web tự join client-side
  /// (`useDashboardStats.ts`), Backend không có endpoint tổng hợp riêng.
  Future<List<InventoryRow>> list() async {
    final data = await ApiClient.instance.get<List<dynamic>>('/inventory');
    return data.map((e) => InventoryRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Tồn kho của 1 item theo từng kho/vị trí (D2) — endpoint thật
  /// `GET /api/inventory/:itemId` (xem 02-BACKEND-SPEC.md).
  Future<List<InventoryRow>> forItem(String itemId) async {
    final data = await ApiClient.instance.get<List<dynamic>>('/inventory/$itemId');
    return data.map((e) => InventoryRow.fromJson(e as Map<String, dynamic>)).toList();
  }
}
