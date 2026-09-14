import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/item.dart';
import '../../models/order_summary.dart';
import '../../models/storage_location.dart';
import '../../models/warehouse.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/history_provider.dart';
import '../../providers/inventory_providers.dart';
import '../../services/api_client.dart';
import '../../services/order_service.dart';
import '../../services/storage_location_service.dart';
import '../../services/warehouse_service.dart';
import '../../utils/app_theme.dart';

/// Form tạo phiếu nhập/xuất "nhanh" (D3) — vật tư đã chọn sẵn từ D2 (không lặp
/// lại ô tìm kiếm vật tư của D1). Tối giản: kho -> vị trí -> số lượng -> 1 nút
/// xác nhận lớn, đúng tinh thần "nhân viên kho thao tác nhanh tại hiện trường".
/// Nhập kho đa dòng (nhiều vật tư/phiếu) dùng màn hình riêng
/// `screens/import/manual_import_screen.dart`, không dùng form này.
class QuickOrderFormScreen extends ConsumerStatefulWidget {
  final Item item;
  final OrderKind kind;

  const QuickOrderFormScreen({super.key, required this.item, required this.kind});

  @override
  ConsumerState<QuickOrderFormScreen> createState() => _QuickOrderFormScreenState();
}

class _QuickOrderFormScreenState extends ConsumerState<QuickOrderFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _qtyController = TextEditingController();

  List<Warehouse> _warehouses = [];
  List<StorageLocation> _locations = [];
  String? _warehouseId;
  String? _locationId;
  bool _loadingWarehouses = true;
  bool _loadingLocations = false;
  bool _submitting = false;
  String? _error;

  bool get _isImport => widget.kind == OrderKind.importOrder;

  @override
  void initState() {
    super.initState();
    _loadWarehouses();
  }

  @override
  void dispose() {
    _qtyController.dispose();
    super.dispose();
  }

  Future<void> _loadWarehouses() async {
    final list = await WarehouseService.instance.listActive();
    if (!mounted) return;
    setState(() {
      _warehouses = list;
      _loadingWarehouses = false;
    });
  }

  Future<void> _onWarehouseChanged(String? id) async {
    setState(() {
      _warehouseId = id;
      _locationId = null;
      _locations = [];
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
    if (!_formKey.currentState!.validate() || _warehouseId == null || _locationId == null) {
      if (_warehouseId == null || _locationId == null) {
        setState(() => _error = 'Vui lòng chọn đầy đủ kho và vị trí');
      }
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    final quickItem = QuickOrderItem(
      itemId: widget.item.itemId,
      locationId: _locationId!,
      quantity: num.parse(_qtyController.text),
    );
    try {
      if (_isImport) {
        await OrderService.instance.createImportAndConfirm(warehouseId: _warehouseId!, items: [quickItem]);
      } else {
        await OrderService.instance.createExportAndConfirm(warehouseId: _warehouseId!, items: [quickItem]);
      }
      if (!mounted) return;
      // Invalidate MỌI provider hiển thị tồn kho/số liệu bị ảnh hưởng — nguyên
      // nhân gốc bug "Chi tiết vật tư không cập nhật sau khi tạo phiếu": các
      // provider này (FutureProvider) mặc định được cache vô thời hạn, không
      // tự fetch lại chỉ vì có 1 lời gọi API mutation xảy ra ở nơi khác.
      ref.invalidate(itemInventoryProvider(widget.item.itemId));
      ref.invalidate(itemsWithStockProvider);
      ref.invalidate(dashboardStatsProvider);
      ref.invalidate(historyProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đã tạo phiếu ${_isImport ? "nhập" : "xuất"} kho thành công')),
      );
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
      appBar: buildBrandAppBar(_isImport ? 'Tạo phiếu nhập nhanh' : 'Tạo phiếu xuất nhanh'),
      body: _loadingWarehouses
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.screenPadding),
                children: [
                  Text(
                    widget.item.itemName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: AppSpacing.tightGap),
                  Text(
                    '${widget.item.itemCode} · ${widget.item.unit}',
                    style: const TextStyle(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: AppSpacing.sectionGap),
                  DropdownButtonFormField<String>(
                    initialValue: _warehouseId,
                    decoration: const InputDecoration(labelText: 'Kho'),
                    items: _warehouses
                        .map((w) => DropdownMenuItem(value: w.warehouseId, child: Text(w.warehouseName)))
                        .toList(),
                    onChanged: _onWarehouseChanged,
                    validator: (v) => v == null ? 'Chọn kho' : null,
                  ),
                  const SizedBox(height: AppSpacing.itemGap),
                  DropdownButtonFormField<String>(
                    initialValue: _locationId,
                    decoration: InputDecoration(
                      labelText: 'Vị trí',
                      suffixIcon: _loadingLocations
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                            )
                          : null,
                    ),
                    items: _locations
                        .map((l) => DropdownMenuItem(value: l.locationId, child: Text(l.locationCode)))
                        .toList(),
                    onChanged: _warehouseId == null ? null : (v) => setState(() => _locationId = v),
                    validator: (v) => v == null ? 'Chọn vị trí' : null,
                  ),
                  const SizedBox(height: AppSpacing.itemGap),
                  TextFormField(
                    controller: _qtyController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    textAlign: TextAlign.center,
                    decoration: const InputDecoration(labelText: 'Số lượng'),
                    validator: (v) {
                      final n = num.tryParse(v ?? '');
                      if (n == null || n <= 0) return 'Nhập số lượng hợp lệ';
                      return null;
                    },
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: AppSpacing.itemGap),
                    Text(_error!, style: const TextStyle(color: AppColors.danger)),
                  ],
                  const SizedBox(height: AppSpacing.sectionGap),
                  ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Xác nhận tạo phiếu'),
                  ),
                ],
              ),
            ),
    );
  }
}
