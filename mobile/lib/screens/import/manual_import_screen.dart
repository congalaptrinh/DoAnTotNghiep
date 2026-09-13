import 'package:flutter/material.dart';

import '../../models/item.dart';
import '../../models/storage_location.dart';
import '../../models/warehouse.dart';
import '../../services/api_client.dart';
import '../../services/item_service.dart';
import '../../services/order_service.dart';
import '../../services/storage_location_service.dart';
import '../../services/warehouse_service.dart';
import '../../utils/app_theme.dart';

class _ManualRow {
  String? itemId;
  String? locationId;
  final TextEditingController qtyController = TextEditingController();

  void dispose() => qtyController.dispose();
}

/// Nhập kho thủ công đa dòng — giống tinh thần `ImportPage.tsx` bên Web: chọn
/// 1 kho chung cho cả phiếu, thêm/xoá được nhiều dòng, mỗi dòng chọn vật tư +
/// vị trí + số lượng riêng. Bổ sung sau khi người dùng test thật thấy "phiếu
/// nhanh" (D3, 1 dòng/phiếu) không đủ cho nhu cầu nhận nhiều vật tư 1 lần —
/// xem quyết định trong 07-DECISIONS-LOG.md. Submit = tạo (DRAFT) + xác nhận
/// ngay 2 lời gọi tuần tự, dùng chung `OrderService.createImportAndConfirm`
/// với D3 (chỉ khác số dòng gửi lên).
class ManualImportScreen extends StatefulWidget {
  const ManualImportScreen({super.key});

  @override
  State<ManualImportScreen> createState() => _ManualImportScreenState();
}

class _ManualImportScreenState extends State<ManualImportScreen> {
  final List<_ManualRow> _rows = [_ManualRow()];

  List<Warehouse> _warehouses = [];
  List<Item> _items = [];
  List<StorageLocation> _locations = [];
  String? _warehouseId;
  bool _loading = true;
  bool _loadingLocations = false;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    for (final r in _rows) {
      r.dispose();
    }
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    final (warehouses, items) = await (WarehouseService.instance.listActive(), ItemService.instance.list()).wait;
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

  void _addRow() => setState(() => _rows.add(_ManualRow()));

  void _removeRow(int index) {
    setState(() {
      _rows.removeAt(index).dispose();
    });
  }

  Future<void> _submit() async {
    if (_warehouseId == null) {
      setState(() => _error = 'Chọn kho nhập trước');
      return;
    }
    final items = <QuickOrderItem>[];
    for (final r in _rows) {
      final qty = num.tryParse(r.qtyController.text) ?? 0;
      if (r.itemId == null || r.locationId == null || qty <= 0) {
        setState(() => _error = 'Mỗi dòng cần đủ vật tư, vị trí và số lượng > 0');
        return;
      }
      items.add(QuickOrderItem(itemId: r.itemId!, locationId: r.locationId!, quantity: qty));
    }

    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await OrderService.instance.createImportAndConfirm(warehouseId: _warehouseId!, items: items);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã tạo phiếu nhập kho thành công')),
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
      appBar: buildBrandAppBar('Nhập kho thủ công'),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.screenPadding,
                    AppSpacing.itemGap,
                    AppSpacing.screenPadding,
                    0,
                  ),
                  child: DropdownButtonFormField<String>(
                    initialValue: _warehouseId,
                    decoration: const InputDecoration(labelText: 'Kho nhập'),
                    items: _warehouses.map((w) => DropdownMenuItem(value: w.warehouseId, child: Text(w.warehouseName))).toList(),
                    onChanged: _onWarehouseChanged,
                  ),
                ),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.screenPadding),
                    itemCount: _rows.length,
                    separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.itemGap),
                    itemBuilder: (context, i) => _ManualRowCard(
                      index: i,
                      row: _rows[i],
                      items: _items,
                      locations: _locations,
                      loadingLocations: _loadingLocations,
                      warehouseSelected: _warehouseId != null,
                      canRemove: _rows.length > 1,
                      onRemove: () => _removeRow(i),
                      onChanged: () => setState(() {}),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: _addRow,
                      icon: const Icon(Icons.add),
                      label: const Text('Thêm dòng vật tư'),
                    ),
                  ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
                    child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
                  ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.screenPadding),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      child: _submitting
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Xác nhận tạo phiếu nhập'),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _ManualRowCard extends StatelessWidget {
  final int index;
  final _ManualRow row;
  final List<Item> items;
  final List<StorageLocation> locations;
  final bool loadingLocations;
  final bool warehouseSelected;
  final bool canRemove;
  final VoidCallback onRemove;
  final VoidCallback onChanged;

  const _ManualRowCard({
    required this.index,
    required this.row,
    required this.items,
    required this.locations,
    required this.loadingLocations,
    required this.warehouseSelected,
    required this.canRemove,
    required this.onRemove,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.itemGap),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Dòng ${index + 1}',
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                ),
                const Spacer(),
                if (canRemove)
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: AppColors.danger),
                    tooltip: 'Xoá dòng',
                    onPressed: onRemove,
                  ),
              ],
            ),
            DropdownButtonFormField<String>(
              initialValue: row.itemId,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Vật tư', isDense: true),
              items: items
                  .map((it) => DropdownMenuItem(value: it.itemId, child: Text(it.itemName, overflow: TextOverflow.ellipsis)))
                  .toList(),
              onChanged: (v) {
                row.itemId = v;
                onChanged();
              },
            ),
            const SizedBox(height: AppSpacing.tightGap),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 3,
                  child: DropdownButtonFormField<String>(
                    initialValue: row.locationId,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Vị trí',
                      isDense: true,
                      suffixIcon: loadingLocations
                          ? const Padding(
                              padding: EdgeInsets.all(10),
                              child: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                            )
                          : null,
                    ),
                    items: locations.map((l) => DropdownMenuItem(value: l.locationId, child: Text(l.locationCode))).toList(),
                    onChanged: warehouseSelected
                        ? (v) {
                            row.locationId = v;
                            onChanged();
                          }
                        : null,
                  ),
                ),
                const SizedBox(width: AppSpacing.tightGap),
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: row.qtyController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Số lượng', isDense: true),
                    onChanged: (_) => onChanged(),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
