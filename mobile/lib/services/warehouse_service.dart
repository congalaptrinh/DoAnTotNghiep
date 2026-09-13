import '../models/warehouse.dart';
import 'api_client.dart';

class WarehouseService {
  WarehouseService._();
  static final instance = WarehouseService._();

  /// Backend chưa hỗ trợ filter query (giống Web) — tự lọc ACTIVE ở client.
  Future<List<Warehouse>> listActive() async {
    final data = await ApiClient.instance.get<List<dynamic>>('/warehouses');
    return data
        .map((e) => Warehouse.fromJson(e as Map<String, dynamic>))
        .where((w) => w.status == 'ACTIVE')
        .toList();
  }
}
