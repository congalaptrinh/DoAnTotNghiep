import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Input, Th, Td } from '../components/PageLayout';

const initialUsers = [
  { id: 'USR-001', name: 'Cao Xuân Khu', email: 'khu.cao@techstore.vn', role: 'admin', roleLabel: 'Quản trị viên', status: 'active', lastLogin: '05/09/2025 09:30' },
  { id: 'USR-002', name: 'Nguyễn Văn An', email: 'an.nguyen@techstore.vn', role: 'manager', roleLabel: 'Quản lý kho', status: 'active', lastLogin: '05/09/2025 08:15' },
  { id: 'USR-003', name: 'Trần Văn Bình', email: 'binh.tran@techstore.vn', role: 'staff', roleLabel: 'Nhân viên kho', status: 'active', lastLogin: '05/09/2025 09:42' },
  { id: 'USR-004', name: 'Lê Thị Hoa', email: 'hoa.le@techstore.vn', role: 'staff', roleLabel: 'Nhân viên kho', status: 'active', lastLogin: '05/09/2025 08:30' },
  { id: 'USR-005', name: 'Phạm Thanh Tú', email: 'tu.pham@techstore.vn', role: 'staff', roleLabel: 'Nhân viên kho', status: 'active', lastLogin: '04/09/2025 16:00' },
  { id: 'USR-006', name: 'Trần Thị Bình', email: 'binh2.tran@techstore.vn', role: 'manager', roleLabel: 'Quản lý kho', status: 'active', lastLogin: '04/09/2025 15:30' },
  { id: 'USR-007', name: 'Vũ Minh Khoa', email: 'khoa.vu@techstore.vn', role: 'viewer', roleLabel: 'Người xem báo cáo', status: 'inactive', lastLogin: '01/08/2025 10:00' },
];

const roleOptions = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'manager', label: 'Quản lý kho' },
  { value: 'staff', label: 'Nhân viên kho' },
  { value: 'viewer', label: 'Người xem báo cáo' },
];

const roleColors: Record<string, 'indigo' | 'blue' | 'green' | 'gray'> = {
  admin: 'indigo', manager: 'blue', staff: 'green', viewer: 'gray',
};

const avatarBg: Record<string, string> = {
  admin: 'bg-indigo-100 text-indigo-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
};

type User = typeof initialUsers[0];
type Modal = { mode: 'add' | 'edit'; user?: User };

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Modal | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'staff', status: 'active' });

  function openAdd() {
    setForm({ name: '', email: '', role: 'staff', status: 'active' });
    setModal({ mode: 'add' });
  }

  function openEdit(u: User) {
    setForm({ name: u.name, email: u.email, role: u.role, status: u.status });
    setModal({ mode: 'edit', user: u });
  }

  function saveModal() {
    if (!form.name || !form.email) return;
    const roleLabel = roleOptions.find((r) => r.value === form.role)?.label ?? '';
    if (modal?.mode === 'add') {
      const newUser: User = {
        id: `USR-${String(users.length + 1).padStart(3, '0')}`,
        name: form.name,
        email: form.email,
        role: form.role,
        roleLabel,
        status: form.status,
        lastLogin: '—',
      };
      setUsers([...users, newUser]);
    } else if (modal?.mode === 'edit' && modal.user) {
      setUsers(users.map((u) => u.id === modal.user!.id
        ? { ...u, name: form.name, email: form.email, role: form.role, roleLabel, status: form.status }
        : u
      ));
    }
    setModal(null);
  }

  function toggleStatus(id: string) {
    setUsers(users.map((u) => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  }

  const filtered = users.filter((u) =>
    search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout
      title="Người dùng"
      subtitle="Quản lý tài khoản và phân quyền hệ thống"
      actions={<Btn onClick={openAdd}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7-7 7 7" />
        </svg>
        Thêm người dùng
      </Btn>}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Tổng tài khoản', value: users.length, color: 'text-gray-900' },
          { label: 'Đang hoạt động', value: users.filter((u) => u.status === 'active').length, color: 'text-green-600' },
          { label: 'Quản lý kho', value: users.filter((u) => u.role === 'manager').length, color: 'text-blue-600' },
          { label: 'Nhân viên kho', value: users.filter((u) => u.role === 'staff').length, color: 'text-indigo-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <Input placeholder="Tìm theo tên hoặc email..." value={search} onChange={setSearch} className="w-64" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Người dùng</Th>
                <Th>Email</Th>
                <Th>Vai trò</Th>
                <Th>Trạng thái</Th>
                <Th>Đăng nhập cuối</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarBg[u.role]}`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><span className="text-gray-600">{u.email}</span></Td>
                  <Td><Badge color={roleColors[u.role]}>{u.roleLabel}</Badge></Td>
                  <Td>
                    <button
                      onClick={() => toggleStatus(u.id)}
                      title="Click để đổi trạng thái"
                    >
                      <Badge color={u.status === 'active' ? 'green' : 'gray'}>
                        {u.status === 'active' ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </Badge>
                    </button>
                  </Td>
                  <Td><span className="text-sm text-gray-500">{u.lastLogin}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors" title="Chỉnh sửa">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => toggleStatus(u.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title={u.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">
                {modal.mode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@techstore.vn"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vai trò</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Vô hiệu hóa</option>
                </select>
              </div>
              {modal.mode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu tạm</label>
                  <input
                    type="password"
                    placeholder="Sẽ được gửi qua email"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Btn onClick={saveModal}>
                {modal.mode === 'add' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
              </Btn>
              <Btn variant="secondary" onClick={() => setModal(null)}>Hủy</Btn>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
