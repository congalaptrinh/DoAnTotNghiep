import PageLayout, { Card, Badge } from '../components/PageLayout';
import { Avatar } from '../components/ui';

const roles = [
  {
    id: 'admin',
    name: 'Quản trị viên',
    color: 'indigo' as const,
    description: 'Toàn quyền quản lý hệ thống, bao gồm cấu hình, phân quyền và tất cả nghiệp vụ kho.',
    users: 1,
    permissions: [
      { group: 'Dashboard & Báo cáo', items: ['Xem dashboard', 'Xem lịch sử biến động', 'Xuất báo cáo Excel'] },
      { group: 'Quản lý vật tư', items: ['Xem/tạo/sửa/xóa danh mục', 'Xem/tạo/sửa/xóa vật tư', 'Xem/quản lý tồn kho'] },
      { group: 'Nghiệp vụ kho', items: ['Nhập kho (tạo/duyệt/hủy)', 'Xuất kho (tạo/duyệt/hủy)', 'Chuyển kho', 'Thu hồi', 'Kiểm kê', 'Thanh lý'] },
      { group: 'Quản lý hệ thống', items: ['Quản lý người dùng', 'Quản lý vai trò', 'Quản lý kho & vị trí', 'Quản lý nhà cung cấp'] },
    ],
  },
  {
    id: 'manager',
    name: 'Quản lý kho',
    color: 'blue' as const,
    description: 'Quản lý toàn bộ hoạt động kho, phê duyệt phiếu, nhưng không thể quản lý người dùng và vai trò.',
    users: 2,
    permissions: [
      { group: 'Dashboard & Báo cáo', items: ['Xem dashboard', 'Xem lịch sử biến động', 'Xuất báo cáo Excel'] },
      { group: 'Quản lý vật tư', items: ['Xem/tạo/sửa danh mục', 'Xem/tạo/sửa vật tư', 'Xem/quản lý tồn kho'] },
      { group: 'Nghiệp vụ kho', items: ['Nhập kho (tạo/duyệt)', 'Xuất kho (tạo/duyệt)', 'Chuyển kho', 'Thu hồi', 'Kiểm kê', 'Thanh lý'] },
      { group: 'Quản lý hệ thống', items: ['Quản lý kho & vị trí', 'Quản lý nhà cung cấp'] },
    ],
  },
  {
    id: 'staff',
    name: 'Nhân viên kho',
    color: 'green' as const,
    description: 'Thực hiện các nghiệp vụ kho hàng ngày theo phân công, không có quyền thanh lý hoặc kiểm kê.',
    users: 3,
    permissions: [
      { group: 'Dashboard & Báo cáo', items: ['Xem dashboard (hạn chế)'] },
      { group: 'Quản lý vật tư', items: ['Xem tồn kho', 'Xem kho & vị trí'] },
      { group: 'Nghiệp vụ kho', items: ['Nhập kho (tạo phiếu)', 'Xuất kho (tạo phiếu)', 'Chuyển kho (tạo phiếu)', 'Thu hồi (tạo phiếu)'] },
    ],
  },
  {
    id: 'viewer',
    name: 'Người xem báo cáo',
    color: 'gray' as const,
    description: 'Chỉ xem dữ liệu tồn kho và lịch sử biến động, không thực hiện bất kỳ thao tác nào.',
    users: 1,
    permissions: [
      { group: 'Dashboard & Báo cáo', items: ['Xem dashboard', 'Xem lịch sử biến động'] },
      { group: 'Quản lý vật tư', items: ['Xem tồn kho (chỉ đọc)'] },
    ],
  },
];

export default function RolesPage() {
  return (
    <PageLayout
      title="Vai trò"
      subtitle="Cấu hình phân quyền theo vai trò trong hệ thống"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roles.map((role) => (
          <Card key={role.id} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar name={role.name} color={role.color} size="md" />
                <div>
                  <h3 className="font-bold text-gray-900">{role.name}</h3>
                  <Badge color={role.color}>{role.users} người dùng</Badge>
                </div>
              </div>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{role.description}</p>

            <div className="space-y-3">
              {role.permissions.map((group) => (
                <div key={group.group}>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{group.group}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <span key={item} className="text-xs px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-gray-600 flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-green-500 flex-shrink-0">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
