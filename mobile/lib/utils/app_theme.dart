import 'package:flutter/material.dart';

/// Design tokens dùng chung với Web App — nguồn DUY NHẤT: `web/src/styles/tokens.css`
/// (đã chốt ở Giai đoạn A2 Web, xem specs/07-DECISIONS-LOG.md). Giá trị PHẢI khớp
/// chính xác với Web, không tự đặt màu khác ở đây.
class AppColors {
  AppColors._();

  // Gradient thương hiệu: AppBar (qua `buildBrandAppBar`), nút hành động chính, màn Đăng nhập
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

  // Chữ — khớp đúng thang xám Tailwind mà Web dùng nhiều nhất cho từng cấp độ
  // (grep `web/src`: gray-900 dùng cho tiêu đề/số liệu chính, gray-700 cho nội
  // dung thường — dùng nhiều nhất, gray-500 cho phụ chú). KHÔNG dùng
  // `Colors.black54/45/26` rải rác nữa — quá nhạt, không khớp độ đậm Web.
  static const textPrimary = Color(0xFF111827); // gray-900 — tiêu đề, số liệu chính
  static const textBody = Color(0xFF374151); // gray-700 — nội dung thường
  static const textMuted = Color(0xFF6B7280); // gray-500 — phụ chú, nhãn phụ

  static const brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brandFrom, brandTo],
  );
}

/// Khoảng cách chuẩn dùng xuyên suốt app — tránh mỗi màn tự chọn số padding
/// khác nhau (8/12/16/20/24 rải rác) làm layout lệch nhau giữa các màn.
class AppSpacing {
  AppSpacing._();

  static const double screenPadding = 16; // lề ngoài cùng của mọi màn hình
  static const double sectionGap = 24; // khoảng cách giữa 2 khối nội dung lớn
  static const double itemGap = 12; // khoảng cách giữa các item cùng cấp (card, dòng form)
  static const double tightGap = 6; // khoảng cách giữa các phần tử liền kề trong 1 item
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
      // Đặt màu chữ mặc định đậm hơn Material3 tự sinh — mọi `Text` không tự
      // set màu (vd `Theme.of(context).textTheme.titleLarge`) sẽ tự động đủ
      // tương phản, không cần mỗi màn tự nhớ set màu.
      textTheme: const TextTheme(
        titleLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        titleMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: AppColors.textBody),
        bodyMedium: TextStyle(color: AppColors.textBody),
      ),
      // Fallback cho AppBar không dùng `buildBrandAppBar` (ThemeData.appBarTheme
      // không nhận Gradient cho backgroundColor — phải áp gradient thủ công
      // qua `flexibleSpace` ở từng AppBar, xem `buildBrandAppBar` bên dưới).
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: Colors.black87,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 1,
        shadowColor: Colors.black.withValues(alpha: 0.10),
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
        unselectedItemColor: AppColors.textMuted,
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

/// AppBar dùng gradient thương hiệu — DÙNG Ở MỌI MÀN HÌNH thay vì `AppBar()`
/// thường, để khớp đúng ý định đã ghi ở A3 (gradient áp cho AppBar, không chỉ
/// nút bấm/màn Đăng nhập). `ThemeData.appBarTheme` không nhận `Gradient` cho
/// `backgroundColor` nên phải làm trong suốt + vẽ gradient qua `flexibleSpace`.
AppBar buildBrandAppBar(String title, {List<Widget>? actions}) {
  return AppBar(
    title: Text(title),
    backgroundColor: Colors.transparent,
    foregroundColor: Colors.white,
    flexibleSpace: const DecoratedBox(decoration: BoxDecoration(gradient: AppColors.brandGradient)),
    actions: actions,
  );
}
