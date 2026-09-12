import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageLayout, { Card, Badge, Btn, Input, Th, Td } from '../components/PageLayout';
import { Modal, ConfirmDialog, useToast, EmptyState } from '../components/ui';
import { usePermission } from '../hooks/usePermission';
import { ApiError } from '../services/apiClient';
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier, type Supplier } from '../services/supplier.service';

type SupplierModal = { mode: 'add' } | { mode: 'edit'; supplier: Supplier };

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

const emptyForm = { supplier_name: '', contact_name: '', phone: '', email: '', address: '' };

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<SupplierModal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { canWrite } = usePermission();
  const { show } = useToast();
  const qc = useQueryClient();

  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: () => listSuppliers() });
  const suppliers = suppliersQuery.data ?? [];

  const filtered = suppliers.filter((s) =>
    search === '' || s.supplier_name.toLowerCase().includes(search.toLowerCase()) || (s.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const detail = suppliers.find((s) => s.supplier_id === selectedId);

  const createMut = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); show('success', 'Đã tạo nhà cung cấp mới'); setModal(null); },
    onError: (err) => show('error', errMsg(err, 'Tạo nhà cung cấp thất bại')),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSupplier>[1] }) => updateSupplier(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); show('success', 'Đã cập nhật nhà cung cấp'); setModal(null); },
    onError: (err) => show('error', errMsg(err, 'Cập nhật nhà cung cấp thất bại')),
  });
  const deleteMut = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); show('success', 'Đã ngừng hợp tác'); setDeleteTarget(null); },
    onError: (err) => { show('error', errMsg(err, 'Thao tác thất bại')); setDeleteTarget(null); },
  });

  function openAdd() {
    setForm(emptyForm);
    setModal({ mode: 'add' });
  }
  function openEdit(s: Supplier) {
    setForm({ supplier_name: s.supplier_name, contact_name: s.contact_name ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '' });
    setModal({ mode: 'edit', supplier: s });
  }
  function saveModal() {
    if (!form.supplier_name.trim()) return;
    const data = {
      supplier_name: form.supplier_name.trim(),
      contact_name: form.contact_name || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
    };
    if (modal?.mode === 'add') createMut.mutate(data);
    else if (modal?.mode === 'edit') updateMut.mutate({ id: modal.supplier.supplier_id, data });
  }

  const canWriteSuppliers = canWrite('suppliers');

  return (
    <PageLayout
      title="Nhà cung cấp"
      subtitle="Quản lý danh sách nhà cung cấp linh kiện và thiết bị"
      actions={
        canWriteSuppliers && (
          <Btn onClick={openAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            Thêm nhà cung cấp
          </Btn>
        )
      }
    >
      {suppliersQuery.isLoading ? (
        <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
      ) : suppliersQuery.error ? (
        <EmptyState title="Không tải được dữ liệu" description={errMsg(suppliersQuery.error, 'Lỗi không xác định')} />
      ) : (
        <div className="flex gap-5">
          {/* List */}
          <div className="flex-1">
            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <Input placeholder="Tìm nhà cung cấp hoặc người liên hệ..." value={search} onChange={setSearch} className="w-full" />
              </div>
              {filtered.length === 0 ? (
                <EmptyState title="Chưa có nhà cung cấp nào" action={canWriteSuppliers ? { label: 'Thêm nhà cung cấp đầu tiên', onClick: openAdd } : undefined} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <Th>Nhà cung cấp</Th>
                        <Th>Người liên hệ</Th>
                        <Th>Email</Th>
                        <Th>Trạng thái</Th>
                        <Th></Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s) => (
                        <tr
                          key={s.supplier_id}
                          className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${selectedId === s.supplier_id ? 'bg-indigo-50/60' : ''}`}
                          onClick={() => setSelectedId(s.supplier_id === selectedId ? null : s.supplier_id)}
                        >
                          <Td>
                            <div className="font-semibold text-gray-900 text-sm">{s.supplier_name}</div>
                          </Td>
                          <Td>
                            <div>
                              <div className="text-sm text-gray-700">{s.contact_name || '—'}</div>
                              <div className="text-xs text-gray-400">{s.phone || ''}</div>
                            </div>
                          </Td>
                          <Td><span className="text-sm text-gray-500">{s.email || '—'}</span></Td>
                          <Td>
                            <Badge color={s.status === 'ACTIVE' ? 'green' : 'gray'}>
                              {s.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hợp tác'}
                            </Badge>
                          </Td>
                          <Td>
                            {canWriteSuppliers && (
                              <div className="flex items-center gap-0.5">
                                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors" onClick={(e) => { e.stopPropagation(); openEdit(s); }} title="Sửa">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                {s.status === 'ACTIVE' && (
                                  <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-danger transition-colors" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: s.supplier_id, name: s.supplier_name }); }} title="Ngừng hợp tác">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                  </button>
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
          </div>

          {/* Detail panel */}
          {detail && (
            <div className="w-72 flex-shrink-0">
              <Card className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-from)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H3m2 0h14M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-0.5">{detail.supplier_name}</h3>
                <Badge color={detail.status === 'ACTIVE' ? 'green' : 'gray'}>
                  {detail.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hợp tác'}
                </Badge>

                <div className="mt-4 space-y-3">
                  {[
                    { label: 'Liên hệ', value: detail.contact_name },
                    { label: 'Điện thoại', value: detail.phone },
                    { label: 'Email', value: detail.email },
                    { label: 'Địa chỉ', value: detail.address },
                    { label: 'Website', value: detail.website },
                  ].filter((item) => item.value).map((item) => (
                    <div key={item.label}>
                      <span className="text-[11px] text-gray-400 uppercase tracking-wider">{item.label}</span>
                      <p className="text-sm text-gray-700 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Thêm nhà cung cấp mới' : 'Chỉnh sửa nhà cung cấp'}
        footer={
          <>
            <Btn onClick={saveModal} disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? 'Đang lưu...' : (modal?.mode === 'add' ? 'Tạo nhà cung cấp' : 'Lưu thay đổi')}
            </Btn>
            <Btn variant="secondary" onClick={() => setModal(null)}>Huỷ</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên nhà cung cấp *</label>
            <Input value={form.supplier_name} onChange={(v) => setForm({ ...form, supplier_name: v })} placeholder="VD: Bách Khoa Electronics" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Người liên hệ</label>
              <Input value={form.contact_name} onChange={(v) => setForm({ ...form, contact_name: v })} placeholder="Không bắt buộc" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Điện thoại</label>
              <Input value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Không bắt buộc" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <Input type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="Không bắt buộc" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
            <Input value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Không bắt buộc" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ngừng hợp tác"
        message={`Ngừng hợp tác với nhà cung cấp "${deleteTarget?.name}"? Lịch sử phiếu nhập cũ vẫn được giữ nguyên.`}
        confirmLabel="Ngừng hợp tác"
        loading={deleteMut.isPending}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageLayout>
  );
}
