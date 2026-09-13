import 'package:flutter_test/flutter_test.dart';
import 'package:wms_mobile/models/user.dart';
import 'package:wms_mobile/utils/permissions.dart';

/// Test RBAC thuần logic (không cần Backend thật) — độ rủi ro cao theo
/// `09-MOBILE-BUILD-CHECKLIST.md` ("RBAC → kiểm tra kỹ, có bằng chứng cụ thể").
/// Khớp CHÍNH XÁC `RESOURCE_WRITE_ACCESS` bên Web cho 3 resource Mobile có
/// thao tác ghi (import_orders/export_orders/ai_detect) — cùng 1 tập role.
void main() {
  group('canWrite — import_orders/export_orders/ai_detect', () {
    for (final resource in MobileWritableResource.values) {
      test('admin luôn được ghi ($resource)', () {
        expect(canWrite(UserRole.admin, resource), isTrue);
      });
      test('warehouse_manager được ghi ($resource)', () {
        expect(canWrite(UserRole.warehouseManager, resource), isTrue);
      });
      test('warehouse_staff được ghi ($resource)', () {
        expect(canWrite(UserRole.warehouseStaff, resource), isTrue);
      });
      test('report_viewer KHÔNG được ghi ($resource)', () {
        expect(canWrite(UserRole.reportViewer, resource), isFalse);
      });
    }

    test('role null (chưa đăng nhập) không được ghi', () {
      expect(canWrite(null, MobileWritableResource.importOrders), isFalse);
    });
  });

  group('userRoleFromWire — map đúng 4 giá trị thật', () {
    test('admin', () => expect(userRoleFromWire('admin'), UserRole.admin));
    test('warehouse_manager', () => expect(userRoleFromWire('warehouse_manager'), UserRole.warehouseManager));
    test('warehouse_staff', () => expect(userRoleFromWire('warehouse_staff'), UserRole.warehouseStaff));
    test('report_viewer', () => expect(userRoleFromWire('report_viewer'), UserRole.reportViewer));
  });
}
