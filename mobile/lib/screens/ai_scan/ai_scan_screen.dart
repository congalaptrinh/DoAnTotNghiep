import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../providers/auth_provider.dart';
import '../../services/ai_service.dart';
import '../../services/api_client.dart';
import '../../utils/app_theme.dart';
import '../../utils/permissions.dart';
import 'ai_result_screen.dart';

/// Giai đoạn E — màn hình chụp ảnh AI (E1/E2). Full-screen, 1 nút chụp lớn ở
/// giữa dưới. Xin quyền camera qua `permission_handler` TRƯỚC khi mở máy ảnh
/// (không dựa vào quyền ngầm của `image_picker` — đúng yêu cầu checklist).
class AiScanScreen extends ConsumerStatefulWidget {
  const AiScanScreen({super.key});

  @override
  ConsumerState<AiScanScreen> createState() => _AiScanScreenState();
}

class _AiScanScreenState extends ConsumerState<AiScanScreen> {
  bool _busy = false;

  Future<void> _capture() async {
    final status = await Permission.camera.request();
    if (!mounted) return;

    if (status.isPermanentlyDenied) {
      _showMessage('Ứng dụng chưa được cấp quyền camera. Mở Cài đặt để bật quyền.');
      await openAppSettings();
      return;
    }
    if (!status.isGranted) {
      _showMessage('Cần quyền camera để chụp ảnh nhận diện AI');
      return;
    }

    final picked = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 85);
    if (picked == null || !mounted) return;

    setState(() => _busy = true);
    try {
      final result = await AiService.instance.detect(File(picked.path));
      if (!mounted) return;
      final created = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => AiResultScreen(imagePath: picked.path, result: result)),
      );
      if (created == true && mounted) {
        _showMessage('Đã tạo phiếu nhập từ AI thành công');
      }
    } on ApiException catch (e) {
      if (mounted) _showMessage(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authProvider).user?.role.roleName;
    final canScan = canWrite(role, MobileWritableResource.aiDetect);

    return Scaffold(
      appBar: buildBrandAppBar('Quét AI'),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sectionGap),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: AppColors.accent.withValues(alpha: 0.15),
                child: const Icon(Icons.camera_alt_outlined, size: 40, color: AppColors.accent),
              ),
              const SizedBox(height: AppSpacing.itemGap),
              Text(
                canScan
                    ? 'Chụp ảnh linh kiện để tạo phiếu nhập kho tự động'
                    : 'Bạn không có quyền tạo phiếu nhập bằng AI',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textBody, fontSize: 15),
              ),
              const SizedBox(height: 32),
              if (canScan)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _busy ? null : _capture,
                    icon: _busy
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.camera_alt),
                    label: Text(_busy ? 'Đang nhận diện...' : 'Chụp ảnh'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
