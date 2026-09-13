/// Khớp field thật của `GET /api/items` (xem `web/src/services/item.service.ts`).
/// Chỉ giữ field Mobile Giai đoạn D dùng tới — không chép nguyên toàn bộ Item
/// thật (specifications/image_url/... không cần cho danh sách/chi tiết tồn kho).
class Item {
  final String itemId;
  final String itemCode;
  final String itemName;
  final String unit;
  final num minStock;

  Item({
    required this.itemId,
    required this.itemCode,
    required this.itemName,
    required this.unit,
    required this.minStock,
  });

  factory Item.fromJson(Map<String, dynamic> json) => Item(
        itemId: json['item_id'] as String,
        itemCode: json['item_code'] as String,
        itemName: json['item_name'] as String,
        unit: json['unit'] as String,
        minStock: json['min_stock'] as num,
      );
}
