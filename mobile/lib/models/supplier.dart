/// Khớp field thật của `GET /api/suppliers` (`web/src/services/supplier.service.ts`).
class Supplier {
  final String supplierId;
  final String supplierName;
  final String status;

  Supplier({required this.supplierId, required this.supplierName, required this.status});

  factory Supplier.fromJson(Map<String, dynamic> json) => Supplier(
        supplierId: json['supplier_id'] as String,
        supplierName: json['supplier_name'] as String,
        status: json['status'] as String,
      );
}
