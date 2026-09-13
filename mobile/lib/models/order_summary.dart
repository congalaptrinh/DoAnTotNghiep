/// Dạng rút gọn dùng chung cho phiếu nhập/xuất trên Trang chủ (C2) — Mobile
/// không cần toàn bộ chi tiết phiếu (đó là việc của Giai đoạn F - Lịch sử),
/// chỉ cần đủ để hiển thị "phiếu gần đây của tôi" + đếm số phiếu DRAFT.
enum OrderKind { importOrder, exportOrder }

class OrderSummary {
  final String id;
  final String code;
  final OrderKind kind;
  final String status;
  final DateTime date;
  final String createdByUserId;

  OrderSummary({
    required this.id,
    required this.code,
    required this.kind,
    required this.status,
    required this.date,
    required this.createdByUserId,
  });

  factory OrderSummary.fromImportJson(Map<String, dynamic> json) => OrderSummary(
        id: json['import_id'] as String,
        code: json['import_code'] as String,
        kind: OrderKind.importOrder,
        status: json['status'] as String,
        date: DateTime.parse(json['import_date'] as String),
        createdByUserId: json['created_by'] as String,
      );

  /// Export dùng `requested_by` (không phải `created_by`) — xem 07-DECISIONS-LOG.md.
  factory OrderSummary.fromExportJson(Map<String, dynamic> json) => OrderSummary(
        id: json['export_id'] as String,
        code: json['export_code'] as String,
        kind: OrderKind.exportOrder,
        status: json['status'] as String,
        date: DateTime.parse(json['export_date'] as String),
        createdByUserId: json['requested_by'] as String,
      );
}
