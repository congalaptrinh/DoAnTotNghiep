import 'package:flutter/material.dart';

import '../../utils/app_theme.dart';

/// Placeholder tab "Lịch sử" — nội dung thật thuộc Giai đoạn F, chưa làm
/// (đang dừng ở C+D theo yêu cầu). Chỉ giữ chỗ trong Bottom Navigation (C1).
class HistoryPlaceholderScreen extends StatelessWidget {
  const HistoryPlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: buildBrandAppBar('Lịch sử'),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.history, size: 48, color: Colors.black26),
              SizedBox(height: 12),
              Text('Sắp ra mắt — Giai đoạn F', style: TextStyle(color: Colors.black45)),
            ],
          ),
        ),
      ),
    );
  }
}
