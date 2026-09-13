/// 4 giá trị vai trò THẬT — khớp `web/src/types.ts` (UserRole) và `01-DATABASE-SCHEMA.md`.
/// Không tự thêm/bớt giá trị.
enum UserRole { admin, warehouseManager, warehouseStaff, reportViewer }

const _roleWireValues = {
  UserRole.admin: 'admin',
  UserRole.warehouseManager: 'warehouse_manager',
  UserRole.warehouseStaff: 'warehouse_staff',
  UserRole.reportViewer: 'report_viewer',
};

const _roleLabels = {
  UserRole.admin: 'Quản trị viên',
  UserRole.warehouseManager: 'Quản lý kho',
  UserRole.warehouseStaff: 'Nhân viên kho',
  UserRole.reportViewer: 'Người xem báo cáo',
};

UserRole userRoleFromWire(String value) {
  return _roleWireValues.entries
      .firstWhere((e) => e.value == value, orElse: () => const MapEntry(UserRole.reportViewer, 'report_viewer'))
      .key;
}

extension UserRoleX on UserRole {
  String get wireValue => _roleWireValues[this]!;
  String get label => _roleLabels[this]!;
}

class UserRoleInfo {
  final String roleId;
  final UserRole roleName;
  final String description;

  UserRoleInfo({required this.roleId, required this.roleName, required this.description});

  factory UserRoleInfo.fromJson(Map<String, dynamic> json) {
    return UserRoleInfo(
      roleId: json['role_id'] as String,
      roleName: userRoleFromWire(json['role_name'] as String),
      description: json['description'] as String? ?? '',
    );
  }
}

/// Khớp CHÍNH XÁC field trả về từ `GET /api/auth/me` / `POST /api/auth/login`
/// (xem `web/src/services/auth.service.ts` — cùng 1 Backend thật).
class AuthUser {
  final String userId;
  final String fullName;
  final String email;
  final String? phone;
  final String roleId;
  final String status;
  final UserRoleInfo role;

  AuthUser({
    required this.userId,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.roleId,
    required this.status,
    required this.role,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      userId: json['user_id'] as String,
      fullName: json['full_name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      roleId: json['role_id'] as String,
      status: json['status'] as String,
      role: UserRoleInfo.fromJson(json['role'] as Map<String, dynamic>),
    );
  }
}
