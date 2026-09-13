/// Khớp field thật của `GET /api/storage-locations` (`web/src/services/storageLocation.service.ts`).
class StorageLocation {
  final String locationId;
  final String warehouseId;
  final String locationCode;
  final String status;

  StorageLocation({
    required this.locationId,
    required this.warehouseId,
    required this.locationCode,
    required this.status,
  });

  factory StorageLocation.fromJson(Map<String, dynamic> json) => StorageLocation(
        locationId: json['location_id'] as String,
        warehouseId: json['warehouse_id'] as String,
        locationCode: json['location_code'] as String,
        status: json['status'] as String,
      );
}
