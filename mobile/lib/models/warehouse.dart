/// Khớp field thật của `GET /api/warehouses` (`web/src/services/warehouse.service.ts`).
class Warehouse {
  final String warehouseId;
  final String warehouseName;
  final String status;

  Warehouse({required this.warehouseId, required this.warehouseName, required this.status});

  factory Warehouse.fromJson(Map<String, dynamic> json) => Warehouse(
        warehouseId: json['warehouse_id'] as String,
        warehouseName: json['warehouse_name'] as String,
        status: json['status'] as String,
      );
}
