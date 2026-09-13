import 'package:flutter/material.dart';

/// Design tokens dùng chung với Web App — nguồn DUY NHẤT: `web/src/styles/tokens.css`
/// (đã chốt ở Giai đoạn A2 Web, xem specs/07-DECISIONS-LOG.md). Giá trị PHẢI khớp
/// chính xác với Web, không tự đặt màu khác ở đây.
class AppColors {
  AppColors._();

  // Gradient thương hiệu: AppBar, nút hành động chính, màn Đăng nhập
  static const brandFrom = Color(0xFF4F46E5);
  static const brandTo = Color(0xFF7C3AED);

  // Màu ngữ nghĩa
  static const danger = Color(0xFFDC2626);
  static const warning = Color(0xFFF59E0B);
  static const success = Color(0xFF16A34A);
  static const info = Color(0xFF2563EB);
  static const accent = Color(0xFF9333EA);

  // Nền & viền
  static const bg = Color(0xFFF8F9FB);
  static const surface = Color(0xFFFFFFFF);
  static const border = Color(0xFFE5E7EB);

  static const brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brandFrom, brandTo],
  );
}

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.brandFrom,
      brightness: Brightness.light,
      primary: AppColors.brandFrom,
      secondary: AppColors.brandTo,
      error: AppColors.danger,
      surface: AppColors.surface,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.bg,
      dividerColor: AppColors.border,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: Colors.black87,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.brandFrom, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brandFrom,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.brandFrom,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}

/// Badge màu theo 7 giá trị movement_type thật (đồng bộ với Web — HistoryPage/Badge)
/// Không được thêm/bớt giá trị so với enum Backend thật.
Color movementTypeColor(String movementType) {
  switch (movementType) {
    case 'IMPORT':
      return AppColors.info;
    case 'EXPORT':
      return AppColors.accent;
    case 'TRANSFER_IN':
    case 'TRANSFER_OUT':
      return AppColors.brandFrom;
    case 'RECOVERY':
      return AppColors.success;
    case 'ADJUSTMENT_STOCKTAKE':
      return AppColors.warning;
    case 'LIQUIDATION':
      return AppColors.danger;
    default:
      return Colors.grey;
  }
}

/// Màu badge theo OrderStatus thật — CHỈ 3 giá trị (không bịa thêm như từng xảy ra ở Web lúc đầu)
Color orderStatusColor(String status) {
  switch (status) {
    case 'DRAFT':
      return AppColors.warning;
    case 'CONFIRMED':
      return AppColors.success;
    case 'CANCELLED':
      return AppColors.danger;
    default:
      return Colors.grey;
  }
}
