import '../models/user.dart';

/// Nguồn DUY NHẤT cho phân quyền trên Mobile — tương đương
/// `web/src/config/permissions.ts`. Mobile chủ yếu dành cho `warehouse_staff`
/// nhưng vẫn cho các vai trò khác đăng nhập được (04-MOBILE-SPEC.md mục 1),
/// chỉ ẩn bớt nút GHI theo đúng phân quyền thật của Backend.
///
/// 4 màn hình chính (Trang chủ/Tồn kho/Quét AI/Lịch sử) đều là ĐỌC — mọi vai
/// trò đăng nhập được đều xem được, không cần chặn ở cấp trang như Web.
/// Chỉ cần chặn ở cấp NÚT GHI, khớp `RESOURCE_WRITE_ACCESS` bên Web cho đúng
/// 3 resource Mobile có thao tác ghi: `import_orders`, `export_orders`,
/// `ai_detect` — cả 3 đều cùng 1 tập role thật: admin + warehouse_manager +
/// warehouse_staff (report_viewer bị loại vì chỉ được xem, theo 00-OVERVIEW.md
/// mục 6 "Người xem báo cáo ... read-only").
enum MobileWritableResource { importOrders, exportOrders, aiDetect }

const _writeAccess = {
  MobileWritableResource.importOrders: {UserRole.admin, UserRole.warehouseManager, UserRole.warehouseStaff},
  MobileWritableResource.exportOrders: {UserRole.admin, UserRole.warehouseManager, UserRole.warehouseStaff},
  MobileWritableResource.aiDetect: {UserRole.admin, UserRole.warehouseManager, UserRole.warehouseStaff},
};

bool canWrite(UserRole? role, MobileWritableResource resource) {
  if (role == null) return false;
  return _writeAccess[resource]!.contains(role);
}
