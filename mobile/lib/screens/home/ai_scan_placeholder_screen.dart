import 'package:flutter/material.dart';

/// Placeholder tab "Quét AI" — nội dung thật thuộc Giai đoạn E (chụp ảnh AI),
/// CHƯA làm vì cần cắm điện thoại thật để test camera. Chỉ giữ chỗ trong
/// Bottom Navigation (C1) để đủ 4 tab đúng `04-MOBILE-SPEC.md`.
class AiScanPlaceholderScreen extends StatelessWidget {
  const AiScanPlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Quét AI')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.camera_alt_outlined, size: 48, color: Colors.black26),
              SizedBox(height: 12),
              Text('Sắp ra mắt — Giai đoạn E', style: TextStyle(color: Colors.black45)),
            ],
          ),
        ),
      ),
    );
  }
}
