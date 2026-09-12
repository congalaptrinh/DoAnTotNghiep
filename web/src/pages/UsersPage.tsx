import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageLayout, { Card, Badge, Btn, Input, Select, Th, Td } from '../components/PageLayout';
import { Modal, ConfirmDialog, useToast, EmptyState, Avatar } from '../components/ui';
import { usePermission } from '../hooks/usePermission';
import { ApiError } from '../services/apiClient';
import { listRoles } from '../services/role.service';
import { listUsers, createUser, updateUser, deleteUser, type User } from '../services/user.service';
import type { UserRole } from '../types';

const roleColors: Record<UserRole, 'indigo' | 'blue' | 'green' | 'gray'> = {
  admin: 'indigo', warehouse_manager: 'blue', warehouse_staff: 'green', report_viewer: 'gray',
};

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

type UserModal = { mode: 'add' } | { mode: 'edit'; user: User };

export default function UsersPage() {
  const { canWrite } = usePermission();
  const canWriteUsers = canWrite('users');
  const qc = useQueryClient();
  const { show } = useToast();

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<UserModal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role_id: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE', password: '' });

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: listRoles });
  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  const createMut = useMutation({
    mutationFn: (data: Parameters<typeof createUser>[0]) => createUser(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); show('success', 'Đã tạo tài khoản mới'); setModal(null); },
    onError: (err) => show('error', errMsg(err, 'Tạo tài khoản thất bại')),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateUser>[1] }) => updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); show('success', 'Đã cập nhật tài khoản'); setModal(null); },
    onError: (err) => show('error', errMsg(err, 'Cập nhật tài khoản thất bại')),
  });
  const reactivateMut = useMutation({
    mutationFn: (id: string) => updateUser(id, { status: 'ACTIVE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); show('success', 'Đã kích hoạt lại tài khoản'); },
    onError: (err) => show('error', errMsg(err, 'Kích hoạt tài khoản thất bại')),
  });
  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); show('success', 'Đã khoá tài khoản'); setDeleteTarget(null); },
    onError: (err) => { show('error', errMsg(err, 'Khoá tài khoản thất bại')); setDeleteTarget(null); },
  });

  function openAdd() {
    setForm({ full_name: '', email: '', phone: '', role_id: roles[0]?.role_id ?? '', status: 'ACTIVE', password: '' });
    setModal({ mode: 'add' });
  }
  function openEdit(u: User) {
    setForm({ full_name: u.full_name, email: u.email, phone: u.phone ?? '', role_id: u.role_id, status: u.status, password: '' });
    setModal({ mode: 'edit', user: u });
  }
  function saveModal() {
    if (!form.full_name.trim() || !form.email.trim() || !form.role_id) return;
    if (modal?.mode === 'add') {
      if (!form.password || form.password.length < 6) return;
      createMut.mutate({
        full_name: form.full_name.trim(), email: form.email.trim(), password: form.password,
        phone: form.phone || undefined, role_id: form.role_id, status: form.status,
      });
    } else if (modal?.mode === 'edit') {
      const data: Parameters<typeof updateUser>[1] = {
        full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone || undefined,
        role_id: form.role_id, status: form.status,
      };
      if (form.password) data.password = form.password;
      updateMut.mutate({ id: modal.user.user_id, data });
    }
  }

  const filtered = users.filter((u) =>
    search === '' || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = usersQuery.isLoading || rolesQuery.isLoading;

  return (
    <PageLayout
      title="Người dùng"
      subtitle="Quản lý tài khoản và phân quyền hệ thống"
      actions={canWriteUsers ? (
        <Btn onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          Thêm người dùng
        </Btn>
      ) : undefined}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Tổng tài khoản', value: users.length, color: 'text-gray-900' },
          { label: 'Đang hoạt động', value: users.filter((u) => u.status === 'ACTIVE').length, color: 'text-green-600' },
          { label: 'Quản lý kho', value: users.filter((u) => u.role.role_name === 'warehouse_manager').length, color: 'text-blue-600' },
          { label: 'Nhân viên kho', value: users.filter((u) => u.role.role_name === 'warehouse_staff').length, color: 'text-indigo-600' },
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
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
        ) : usersQuery.error ? (
          <EmptyState title="Không tải được dữ liệu" description={errMsg(usersQuery.error, 'Lỗi không xác định')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Người dùng</Th>
                  <Th>Email</Th>
                  <Th>Vai trò</Th>
                  <Th>Trạng thái</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Không tìm thấy người dùng nào</td></tr>
                ) : filtered.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50/60 transition-colors">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.full_name} color={roleColors[u.role.role_name]} />
                        <div>
                          <div className="font-semibold text-gray-900">{u.full_name}</div>
                          {u.phone && <div className="text-xs text-gray-400">{u.phone}</div>}
                        </div>
                      </div>
                    </Td>
                    <Td><span className="text-gray-600">{u.email}</span></Td>
                    <Td><Badge color={roleColors[u.role.role_name]}>{u.role.description ?? u.role.role_name}</Badge></Td>
                    <Td>
                      <Badge color={u.status === 'ACTIVE' ? 'green' : 'gray'}>
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hoá'}
                      </Badge>
                    </Td>
                    <Td>
                      {canWriteUsers && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors" title="Chỉnh sửa">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {u.status === 'ACTIVE' ? (
                            <button onClick={() => setDeleteTarget(u)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-danger transition-colors" title="Khoá tài khoản">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          ) : (
                            <Btn size="sm" variant="ghost" onClick={() => reactivateMut.mutate(u.user_id)} disabled={reactivateMut.isPending}>Kích hoạt</Btn>
                          )}
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
        footer={
          <>
            <Btn onClick={saveModal} disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? 'Đang lưu...' : (modal?.mode === 'add' ? 'Tạo tài khoản' : 'Lưu thay đổi')}
            </Btn>
            <Btn variant="secondary" onClick={() => setModal(null)}>Huỷ</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên *</label>
            <Input value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <Input type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="email@warehouse.local" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
            <Input value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Không bắt buộc" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vai trò *</label>
            <Select
              value={form.role_id}
              onChange={(v) => setForm({ ...form, role_id: v })}
              options={roles.map((r) => ({ value: r.role_id, label: r.description ?? r.role_name }))}
            />
          </div>
          {modal?.mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
              <Select
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as 'ACTIVE' | 'INACTIVE' })}
                options={[{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Vô hiệu hoá' }]}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {modal?.mode === 'add' ? 'Mật khẩu *' : 'Đổi mật khẩu'}
            </label>
            <Input
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder={modal?.mode === 'add' ? 'Tối thiểu 6 ký tự' : 'Để trống nếu không đổi'}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Khoá tài khoản"
        message={`Khoá tài khoản "${deleteTarget?.full_name}"? Tài khoản sẽ không thể đăng nhập cho đến khi được kích hoạt lại.`}
        confirmLabel="Khoá tài khoản"
        loading={deleteMut.isPending}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.user_id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageLayout>
  );
}
