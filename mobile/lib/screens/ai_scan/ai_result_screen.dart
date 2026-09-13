import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../../models/ai_detect_result.dart';
import '../../models/item.dart';
import '../../models/storage_location.dart';
import '../../models/warehouse.dart';
import '../../services/api_client.dart';
import '../../services/item_service.dart';
import '../../services/order_service.dart';
import '../../services/storage_location_service.dart';
import '../../services/warehouse_service.dart';
import '../../utils/app_theme.dart';

/// Mỗi dòng ứng với 1 nhãn AI gộp (`summary[]`) — bắt buộc map sang vật tư +
/// vị trí thật trước khi tạo phiếu (mock AI không gắn `item_id` — xem
/// 07-DECISIONS-LOG.md). Số lượng = 0 nghĩa là BỎ nhãn này, không đưa vào phiếu
/// (tương đương nút "xoá dòng" bên Web, gọn hơn vì không cần thêm nút riêng).
class _LabelRow {
  final String className;
  final int detectedCount;
  int quantity;
  String? itemId;
  String? locationId;

  _LabelRow({required this.className, required this.detectedCount})
    : quantity = detectedCount;
}

class AiResultScreen extends StatefulWidget {
  final String imagePath;
  final AiDetectResult result;

  const AiResultScreen({
    super.key,
    required this.imagePath,
    required this.result,
  });

  @override
  State<AiResultScreen> createState() => _AiResultScreenState();
}

class _AiResultScreenState extends State<AiResultScreen> {
  late final List<_LabelRow> _rows;
  late final Uint8List _imageBytes;

  List<Warehouse> _warehouses = [];
  List<StorageLocation> _locations = [];
  List<Item> _items = [];
  String? _warehouseId;
  bool _loading = true;
  bool _loadingLocations = false;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _rows = widget.result.summary
        .map((s) => _LabelRow(className: s.className, detectedCount: s.count))
        .toList();
    _imageBytes = _decodeDataUri(widget.result.annotatedImage);
    _loadInitialData();
  }

  Uint8List _decodeDataUri(String dataUri) {
    final commaIndex = dataUri.indexOf(',');
    return base64Decode(
      commaIndex == -1 ? dataUri : dataUri.substring(commaIndex + 1),
    );
  }

  Future<void> _loadInitialData() async {
    final (warehouses, items) = await (
      WarehouseService.instance.listActive(),
      ItemService.instance.list(),
    ).wait;
    if (!mounted) return;
    setState(() {
      _warehouses = warehouses;
      _items = items;
      _loading = false;
    });
  }

  Future<void> _onWarehouseChanged(String? id) async {
    setState(() {
      _warehouseId = id;
      _locations = [];
      for (final r in _rows) {
        r.locationId = null;
      }
      _loadingLocations = id != null;
    });
    if (id == null) return;
    final list = await StorageLocationService.instance.listForWarehouse(id);
    if (!mounted) return;
    setState(() {
      _locations = list;
      _loadingLocations = false;
    });
  }

  Future<void> _submit() async {
    final activeRows = _rows.where((r) => r.quantity > 0).toList();
    if (_warehouseId == null ||
        activeRows.isEmpty ||
        activeRows.any((r) => r.itemId == null || r.locationId == null)) {
      setState(
        () => _error =
            'Chọn kho + đủ vật tư/vị trí cho mọi nhãn còn số lượng > 0',
      );
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await OrderService.instance.createFromAi(
        warehouseId: _warehouseId!,
        items: activeRows
            .map(
              (r) => QuickOrderItem(
                itemId: r.itemId!,
                locationId: r.locationId!,
                quantity: r.quantity,
              ),
            )
            .toList(),
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kết quả nhận diện')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _BoundingBoxImage(
                  imageBytes: _imageBytes,
                  detections: widget.result.detections,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: DropdownButtonFormField<String>(
                    initialValue: _warehouseId,
                    decoration: const InputDecoration(labelText: 'Kho nhập'),
                    items: _warehouses
                        .map(
                          (w) => DropdownMenuItem(
                            value: w.warehouseId,
                            child: Text(w.warehouseName),
                          ),
                        )
                        .toList(),
                    onChanged: _onWarehouseChanged,
                  ),
                ),
                SizedBox(
                  height: 230,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: _rows.length,
                    itemBuilder: (context, i) => _LabelCard(
                      row: _rows[i],
                      items: _items,
                      locations: _locations,
                      loadingLocations: _loadingLocations,
                      warehouseSelected: _warehouseId != null,
                      onChanged: () => setState(() {}),
                    ),
                  ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: AppColors.danger),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      child: _submitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Xác nhận tạo phiếu nhập'),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _LabelCard extends StatefulWidget {
  final _LabelRow row;
  final List<Item> items;
  final List<StorageLocation> locations;
  final bool loadingLocations;
  final bool warehouseSelected;
  final VoidCallback onChanged;

  const _LabelCard({
    required this.row,
    required this.items,
    required this.locations,
    required this.loadingLocations,
    required this.warehouseSelected,
    required this.onChanged,
  });

  @override
  State<_LabelCard> createState() => _LabelCardState();
}

class _LabelCardState extends State<_LabelCard> {
  late final _qtyController = TextEditingController(
    text: '${widget.row.quantity}',
  );

  @override
  void dispose() {
    _qtyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final row = widget.row;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      child: Container(
        width: 220,
        padding: const EdgeInsets.all(10),
        // Cuộn bên trong thẻ thay vì overflow cứng — tên vật tư/vị trí dài
        // hoặc cỡ chữ hệ thống lớn (đã gặp thật trên điện thoại: tràn 48px)
        // không còn làm vỡ layout, chỉ cần vuốt thêm trong thẻ.
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                row.className,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                'AI nhận diện: ${row.detectedCount}',
                style: const TextStyle(fontSize: 11, color: Colors.black45),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _qtyController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Số lượng',
                  isDense: true,
                ),
                onChanged: (v) {
                  row.quantity = int.tryParse(v) ?? 0;
                  widget.onChanged();
                },
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: row.itemId,
                isExpanded: true,
                decoration: const InputDecoration(
                  labelText: 'Vật tư',
                  isDense: true,
                ),
                items: widget.items
                    .map(
                      (it) => DropdownMenuItem(
                        value: it.itemId,
                        child: Text(
                          it.itemName,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (v) {
                  row.itemId = v;
                  widget.onChanged();
                },
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: row.locationId,
                isExpanded: true,
                decoration: const InputDecoration(
                  labelText: 'Vị trí',
                  isDense: true,
                ),
                items: widget.locations
                    .map(
                      (l) => DropdownMenuItem(
                        value: l.locationId,
                        child: Text(l.locationCode),
                      ),
                    )
                    .toList(),
                onChanged: widget.warehouseSelected
                    ? (v) {
                        row.locationId = v;
                        widget.onChanged();
                      }
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Vẽ overlay bounding box lên `annotated_image` — cùng công thức % như Web
/// (`ImportPage.tsx`): scale = kích thước hiển thị / kích thước gốc ảnh (pixel).
class _BoundingBoxImage extends StatefulWidget {
  final Uint8List imageBytes;
  final List<AiDetection> detections;

  const _BoundingBoxImage({required this.imageBytes, required this.detections});

  @override
  State<_BoundingBoxImage> createState() => _BoundingBoxImageState();
}

class _BoundingBoxImageState extends State<_BoundingBoxImage> {
  // Giải mã 1 LẦN DUY NHẤT lúc ảnh nạp xong (không phải mỗi lần cha rebuild
  // khi người dùng sửa số lượng/chọn dropdown — State được giữ nguyên qua các
  // lần rebuild đó nên `late final` ở đây chỉ chạy đúng 1 lần).
  late final Future<ui.Image> _future = _decode();

  Future<ui.Image> _decode() async {
    final codec = await ui.instantiateImageCodec(widget.imageBytes);
    final frame = await codec.getNextFrame();
    return frame.image;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ui.Image>(
      future: _future,
      builder: (context, snapshot) {
        final img = snapshot.data;
        if (img == null) {
          return const SizedBox(
            height: 250,
            child: Center(child: CircularProgressIndicator()),
          );
        }

        return AspectRatio(
          aspectRatio: img.width / img.height,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final scaleX = constraints.maxWidth / img.width;
              final scaleY = constraints.maxHeight / img.height;
              return Stack(
                fit: StackFit.expand,
                children: [
                  Image.memory(widget.imageBytes, fit: BoxFit.fill),
                  for (final d in widget.detections)
                    Positioned(
                      left: d.boundingBox.x * scaleX,
                      top: d.boundingBox.y * scaleY,
                      width: d.boundingBox.width * scaleX,
                      height: d.boundingBox.height * scaleY,
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.danger, width: 2),
                        ),
                        alignment: Alignment.topLeft,
                        child: Container(
                          color: AppColors.danger,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 1,
                          ),
                          child: Text(
                            '${d.className} ${(d.confidence * 100).round()}%',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        );
      },
    );
  }
}
