import '../models/order_summary.dart';
import 'api_client.dart';

class QuickOrderItem {
  final String itemId;
  final String locationId;
  final num quantity;

  QuickOrderItem({required this.itemId, required this.locationId, required this.quantity});

  Map<String, dynamic> toJson() => {'item_id': itemId, 'location_id': locationId, 'quantity': quantity};
}

/// Phiếu nhập/xuất "nhanh" (D3): tạo (DRAFT) rồi xác nhận ngay — 2 lời gọi
/// tuần tự, giống `ExportPage.tsx` bên Web (Backend không có API tạo+xác nhận
/// 1 bước, trừ `/import-orders/from-ai` dành riêng cho luồng AI Giai đoạn E).
class OrderService {
  OrderService._();
  static final instance = OrderService._();

  Future<void> createImportAndConfirm({required String warehouseId, required QuickOrderItem item}) async {
    final created = await ApiClient.instance.post<Map<String, dynamic>>(
      '/import-orders',
      data: {'warehouse_id': warehouseId, 'items': [item.toJson()]},
    );
    await ApiClient.instance.post('/import-orders/${created['import_id']}/confirm');
  }

  Future<void> createExportAndConfirm({required String warehouseId, required QuickOrderItem item}) async {
    final created = await ApiClient.instance.post<Map<String, dynamic>>(
      '/export-orders',
      data: {'warehouse_id': warehouseId, 'items': [item.toJson()]},
    );
    await ApiClient.instance.post('/export-orders/${created['export_id']}/confirm');
  }

  Future<List<OrderSummary>> listImport({String? status}) async {
    final data = await ApiClient.instance.get<List<dynamic>>(
      '/import-orders',
      queryParameters: status != null ? {'status': status} : null,
    );
    return data.map((e) => OrderSummary.fromImportJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<OrderSummary>> listExport({String? status}) async {
    final data = await ApiClient.instance.get<List<dynamic>>(
      '/export-orders',
      queryParameters: status != null ? {'status': status} : null,
    );
    return data.map((e) => OrderSummary.fromExportJson(e as Map<String, dynamic>)).toList();
  }
}
