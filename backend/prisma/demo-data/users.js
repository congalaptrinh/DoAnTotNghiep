// 3 tài khoản demo mới (giữ nguyên admin@warehouse.local có sẵn, không đụng tới).
// Mật khẩu chung, ghi trong README.md gốc.
const DEMO_PASSWORD = 'Demo@2026';

module.exports = {
  password: DEMO_PASSWORD,
  users: [
    { full_name: 'Nguyễn Văn Minh', email: 'minh.nguyen@demo.local', role_name: 'warehouse_manager' },
    { full_name: 'Trần Thị Lan', email: 'lan.tran@demo.local', role_name: 'warehouse_staff' },
    { full_name: 'Phạm Văn Đức', email: 'duc.pham@demo.local', role_name: 'report_viewer' },
  ],
};
