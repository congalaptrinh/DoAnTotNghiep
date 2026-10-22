import '../models/supplier.dart';
import 'api_client.dart';

class SupplierService {
  SupplierService._();
  static final instance = SupplierService._();

  /// Backend chưa hỗ trợ filter query (giống Web) — tự lọc ACTIVE ở client.
  Future<List<Supplier>> listActive() async {
    final data = await ApiClient.instance.get<List<dynamic>>('/suppliers');
    return data
        .map((e) => Supplier.fromJson(e as Map<String, dynamic>))
        .where((s) => s.status == 'ACTIVE')
        .toList();
  }
}
