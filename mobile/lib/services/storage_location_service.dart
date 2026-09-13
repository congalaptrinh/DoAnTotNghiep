import '../models/storage_location.dart';
import 'api_client.dart';

class StorageLocationService {
  StorageLocationService._();
  static final instance = StorageLocationService._();

  Future<List<StorageLocation>> listForWarehouse(String warehouseId) async {
    final data = await ApiClient.instance.get<List<dynamic>>(
      '/storage-locations',
      queryParameters: {'warehouse_id': warehouseId, 'status': 'ACTIVE'},
    );
    return data.map((e) => StorageLocation.fromJson(e as Map<String, dynamic>)).toList();
  }
}
