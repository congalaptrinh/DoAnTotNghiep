import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'utils/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: WmsApp()));
}

class WmsApp extends StatelessWidget {
  const WmsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TechStore WMS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      // Màn Đăng nhập + go_router thật sẽ thay placeholder này ở Giai đoạn B/C.
      home: const _ScaffoldPlaceholder(),
    );
  }
}

class _ScaffoldPlaceholder extends StatelessWidget {
  const _ScaffoldPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        child: const SafeArea(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.warehouse_rounded, color: Colors.white, size: 56),
                SizedBox(height: 16),
                Text(
                  'TechStore WMS',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Giai đoạn A — nền tảng dự án đã sẵn sàng',
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
