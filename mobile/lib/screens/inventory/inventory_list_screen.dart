import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/inventory_providers.dart';
import '../../utils/app_theme.dart';
import 'item_detail_screen.dart';

class InventoryListScreen extends ConsumerStatefulWidget {
  const InventoryListScreen({super.key});

  @override
  ConsumerState<InventoryListScreen> createState() => _InventoryListScreenState();
}

class _InventoryListScreenState extends ConsumerState<InventoryListScreen> {
  Timer? _debounce;

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      ref.read(itemSearchQueryProvider.notifier).state = value;
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final itemsAsync = ref.watch(itemsWithStockProvider);

    return Scaffold(
      appBar: buildBrandAppBar('Tồn kho'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              onChanged: _onSearchChanged,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Tìm theo tên hoặc mã vật tư',
              ),
            ),
          ),
          Expanded(
            child: itemsAsync.when(
              data: (rows) => rows.isEmpty
                  ? const Center(child: Text('Không tìm thấy vật tư'))
                  : RefreshIndicator(
                      onRefresh: () => ref.refresh(itemsWithStockProvider.future),
                      child: ListView.builder(
                        itemCount: rows.length,
                        itemBuilder: (context, i) {
                          final (item, stock) = rows[i];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            child: ListTile(
                              title: Text(item.itemName, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text('${item.itemCode} · ${item.unit}'),
                              trailing: Text(
                                '$stock',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: stock <= item.minStock ? AppColors.danger : AppColors.success,
                                ),
                              ),
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => ItemDetailScreen(item: item)),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Lỗi tải dữ liệu: $e')),
            ),
          ),
        ],
      ),
    );
  }
}
