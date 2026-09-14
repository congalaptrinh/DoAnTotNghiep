import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/auth_provider.dart';
import '../../utils/app_theme.dart';
import '../../utils/permissions.dart';
import '../ai_scan/ai_scan_screen.dart';
import 'manual_import_screen.dart';

/// Tab "Nhập kho" (thay cho tab "Quét AI" cũ) — điểm vào DUY NHẤT cho mọi cách
/// tạo phiếu nhập kho từ menu chính (không phải từ chi tiết 1 vật tư cụ thể —
/// đó vẫn là "Nhập nhanh" ở `item_detail_screen.dart`, giữ nguyên, 1 dòng).
/// Quyết định phát sinh sau khi test thật: bổ sung lựa chọn "Nhập kho thủ công"
/// đa dòng (giống Web `ImportPage.tsx`) bên cạnh luồng AI đã có — xem
/// 07-DECISIONS-LOG.md.
class ImportHubScreen extends ConsumerWidget {
  const ImportHubScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authProvider).user?.role.roleName;
    final canImport = canWrite(role, MobileWritableResource.importOrders);
    final canAiDetect = canWrite(role, MobileWritableResource.aiDetect);

    return Scaffold(
      appBar: buildBrandAppBar('Nhập kho'),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.screenPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Chọn cách nhập kho', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            const SizedBox(height: AppSpacing.itemGap),
            if (!canImport && !canAiDetect)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: AppSpacing.sectionGap),
                child: Text(
                  'Bạn không có quyền tạo phiếu nhập kho.',
                  style: TextStyle(color: AppColors.textMuted),
                ),
              )
            else ...[
              if (canImport)
                _ImportOptionCard(
                  icon: Icons.edit_note,
                  color: AppColors.info,
                  title: 'Nhập kho thủ công',
                  subtitle: 'Chọn kho, thêm nhiều dòng vật tư — mỗi dòng chọn vật tư, vị trí, số lượng riêng',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const ManualImportScreen()),
                  ),
                ),
              if (canImport && canAiDetect) const SizedBox(height: AppSpacing.itemGap),
              if (canAiDetect)
                _ImportOptionCard(
                  icon: Icons.camera_alt,
                  color: AppColors.accent,
                  title: 'Quét AI',
                  subtitle: 'Chụp ảnh linh kiện — hệ thống tự nhận diện loại và số lượng',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AiScanScreen()),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ImportOptionCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ImportOptionCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.itemGap),
          child: Row(
            children: [
              CircleAvatar(radius: 24, backgroundColor: color.withValues(alpha: 0.15), child: Icon(icon, color: color)),
              const SizedBox(width: AppSpacing.itemGap),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.textPrimary)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
