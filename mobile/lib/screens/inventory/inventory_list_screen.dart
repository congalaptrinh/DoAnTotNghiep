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
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.screenPadding,
              AppSpacing.itemGap,
              AppSpacing.screenPadding,
              AppSpacing.tightGap,
            ),
            child: TextField(
              onChanged: _onSearchChanged,
              // `keyboardType: visiblePassword` tắt hẳn chế độ gõ có dấu (bộ gõ
              // Telex tiếng Việt, ví dụ LabanKey) — nếu không tắt, gõ liên tiếp
              // "S" ngay sau nguyên âm (rất hay gặp trong mã vật tư kiểu
              // "TEST-..." ) sẽ bị bộ gõ ghép thành dấu sắc ("TEST" ->
              // "TÉT"), khiến chuỗi gửi lên Backend sai lệch và không khớp được
              // item_code thật — đây là nguyên nhân gốc bug "tìm theo tên được,
              // tìm theo mã thì không", xác nhận bằng test gõ trực tiếp trên
              // thiết bị thật (IME đang dùng: LabanKey Telex).
              keyboardType: TextInputType.visiblePassword,
              autocorrect: false,
              enableSuggestions: false,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search, color: AppColors.textMuted),
                hintText: 'Tìm theo tên hoặc mã vật tư',
              ),
            ),
          ),
          Expanded(
            child: itemsAsync.when(
              data: (rows) => rows.isEmpty
                  ? const Center(
                      child: Text('Không tìm thấy vật tư', style: TextStyle(color: AppColors.textMuted)),
                    )
                  : RefreshIndicator(
                      onRefresh: () => ref.refresh(itemsWithStockProvider.future),
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.tightGap),
                        itemCount: rows.length,
                        itemBuilder: (context, i) {
                          final (item, stock) = rows[i];
                          final low = stock <= item.minStock;
                          final stockColor = low ? AppColors.danger : AppColors.success;
                          return Card(
                            margin: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.screenPadding,
                              vertical: AppSpacing.tightGap,
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              title: Text(
                                item.itemName,
                                style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                              ),
                              subtitle: Text(
                                '${item.itemCode} · ${item.unit}',
                                style: const TextStyle(color: AppColors.textMuted),
                              ),
                              trailing: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '$stock',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: stockColor),
                                  ),
                                  Text(
                                    low ? 'sắp hết' : 'còn hàng',
                                    style: TextStyle(fontSize: 11, color: stockColor),
                                  ),
                                ],
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
              error: (e, _) => Center(child: Text('Lỗi tải dữ liệu: $e', style: const TextStyle(color: AppColors.danger))),
            ),
          ),
        ],
      ),
    );
  }
}
