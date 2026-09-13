/// Khớp field thật của `GET /api/inventory` và `GET /api/inventory/:itemId`
/// (`web/src/services/inventory.service.ts`). `warehouse`/`location` có thể
/// null nếu Backend không include (không xảy ra trong thực tế nhưng an toàn kiểu).
class InventoryWarehouseRef {
  final String warehouseId;
  final String warehouseName;

  InventoryWarehouseRef({required this.warehouseId, required this.warehouseName});

  factory InventoryWarehouseRef.fromJson(Map<String, dynamic> json) => InventoryWarehouseRef(
        warehouseId: json['warehouse_id'] as String,
        warehouseName: json['warehouse_name'] as String,
      );
}

class InventoryLocationRef {
  final String locationId;
  final String locationCode;

  InventoryLocationRef({required this.locationId, required this.locationCode});

  factory InventoryLocationRef.fromJson(Map<String, dynamic> json) => InventoryLocationRef(
        locationId: json['location_id'] as String,
        locationCode: json['location_code'] as String,
      );
}

class InventoryRow {
  final String itemId;
  final String warehouseId;
  final String locationId;
  final num availableQuantity;
  final InventoryWarehouseRef? warehouse;
  final InventoryLocationRef? location;

  InventoryRow({
    required this.itemId,
    required this.warehouseId,
    required this.locationId,
    required this.availableQuantity,
    this.warehouse,
    this.location,
  });

  factory InventoryRow.fromJson(Map<String, dynamic> json) => InventoryRow(
        itemId: json['item_id'] as String,
        warehouseId: json['warehouse_id'] as String,
        locationId: json['location_id'] as String,
        availableQuantity: json['available_quantity'] as num,
        warehouse: json['warehouse'] != null
            ? InventoryWarehouseRef.fromJson(json['warehouse'] as Map<String, dynamic>)
            : null,
        location: json['location'] != null
            ? InventoryLocationRef.fromJson(json['location'] as Map<String, dynamic>)
            : null,
      );
}
