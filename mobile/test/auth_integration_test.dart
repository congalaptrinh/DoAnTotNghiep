import 'package:flutter_test/flutter_test.dart';
import 'package:wms_mobile/models/user.dart';
import 'package:wms_mobile/services/api_client.dart';
import 'package:wms_mobile/services/auth_service.dart';
import 'package:wms_mobile/services/secure_storage_service.dart';

import 'test_helpers/fake_secure_storage.dart';

/// Test đăng nhập THẬT — gọi thẳng Backend đang chạy tại localhost:5000
/// (không mock) bằng 4 tài khoản thật đã có sẵn từ Giai đoạn Web (xem
/// `07-DECISIONS-LOG.md`). RBAC là logic rủi ro cao theo
/// `09-MOBILE-BUILD-CHECKLIST.md` nên cần bằng chứng cụ thể, không chỉ code
/// review. Yêu cầu: Backend phải đang chạy ở port 5000 trước khi `flutter test`.
void main() {
  setUpAll(setUpFakeSecureStorage);

  const accounts = {
    UserRole.admin: ('admin@warehouse.local', 'Admin@123'),
    UserRole.warehouseManager: ('manager.test@warehouse.local', 'Manager@123'),
    UserRole.warehouseStaff: ('staff.test@warehouse.local', 'Staff@123'),
    UserRole.reportViewer: ('viewer.test@warehouse.local', 'Viewer@123'),
  };

  group('AuthService.login — 4 tài khoản thật, đúng vai trò', () {
    for (final entry in accounts.entries) {
      test('${entry.key.wireValue} đăng nhập đúng, trả đúng role', () async {
        final (email, password) = entry.value;
        final result = await AuthService.instance.login(email, password);

        expect(result.token, isNotEmpty);
        expect(result.user.email, email);
        expect(result.user.role.roleName, entry.key);
        expect(result.user.status, 'ACTIVE');
      });
    }
  });

  test('Sai mật khẩu -> ApiException, KHÔNG trả token', () async {
    await expectLater(
      AuthService.instance.login('admin@warehouse.local', 'sai-mat-khau'),
      throwsA(isA<ApiException>().having((e) => e.status, 'status', 401)),
    );
  });

  test('GET /auth/me sau khi login trả đúng user vừa đăng nhập', () async {
    final login = await AuthService.instance.login('staff.test@warehouse.local', 'Staff@123');
    await SecureStorageService.instance.setToken(login.token);

    final me = await AuthService.instance.getMe();

    expect(me.userId, login.user.userId);
    expect(me.role.roleName, UserRole.warehouseStaff);

    await SecureStorageService.instance.clearToken();
  });

  test('GET /auth/me KHÔNG có token -> 401 (không tự chế dữ liệu)', () async {
    await SecureStorageService.instance.clearToken();
    await expectLater(
      AuthService.instance.getMe(),
      throwsA(isA<ApiException>().having((e) => e.status, 'status', 401)),
    );
  });
}
