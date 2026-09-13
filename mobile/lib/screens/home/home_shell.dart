import 'package:flutter/material.dart';

import '../import/import_hub_screen.dart';
import '../inventory/inventory_list_screen.dart';
import 'history_placeholder_screen.dart';
import 'home_screen.dart';

/// Bottom Navigation 4 tab (C1) — thay thế hoàn toàn `HomePlaceholderScreen`
/// của Giai đoạn B. `IndexedStack` giữ state từng tab khi chuyển qua lại (đơn
/// giản hơn route lồng go_router, không cần deep-link riêng cho từng tab).
/// Tab 3 đổi từ "Quét AI" sang "Nhập kho" (mở màn chọn Nhập kho thủ công/Quét
/// AI) sau khi bổ sung form nhập kho đa dòng — xem 07-DECISIONS-LOG.md.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _screens = [
    HomeScreen(),
    InventoryListScreen(),
    ImportHubScreen(),
    HistoryPlaceholderScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Trang chủ'),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2),
            label: 'Tồn kho',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.move_to_inbox_outlined),
            activeIcon: Icon(Icons.move_to_inbox),
            label: 'Nhập kho',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.history_outlined), activeIcon: Icon(Icons.history), label: 'Lịch sử'),
        ],
      ),
    );
  }
}
