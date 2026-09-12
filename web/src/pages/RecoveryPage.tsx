import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageLayout, { Card, Badge, Btn, Input, Select, Th, Td } from '../components/PageLayout';
import { Modal, EmptyState, useToast } from '../components/ui';
import { usePermission } from '../hooks/usePermission';
import { ApiError } from '../services/apiClient';
import { listWarehouses } from '../services/warehouse.service';
import { listItems } from '../services/item.service';
import { listStorageLocations } from '../services/storageLocation.service';
import {
  listRecoveryOrders, createRecoveryOrder, confirmRecoveryOrder, type RecoveryOrder,
} from '../services/recoveryOrder.service';
import type { OrderStatus } from '../services/orders.service';

const statusConfig: Record<OrderStatus, { label: string; color: 'gray' | 'green' | 'red' }> = {
  DRAFT: { label: 'Nháp', color: 'gray' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'green' },
  CANCELLED: { label: 'Đã huỷ', color: 'red' },
};

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

interface FormRow {
  key: string;
  item_id: string;
  location_id: string;
  quantity: number;
}

let rowSeq = 0;
function newRow(): FormRow {
  return { key: `r${rowSeq++}`, item_id: '', location_id: '', quantity: 1 };
}

export default function RecoveryPage() {
  const { canWrite } = usePermission();
  const canWriteRecovery = canWrite('recovery_orders');
  const qc = useQueryClient();
  const { show } = useToast();

  const [view, setView] = useState<'list' | 'create'>('list');
  const [detailId, setDetailId] = useState<string | null>(null);

  const ordersQuery = useQuery({ queryKey: ['recovery-orders'], queryFn: () => listRecoveryOrders() });
  const warehousesQuery = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const itemsQuery = useQuery({ queryKey: ['items'], queryFn: () => listItems() });
  const locationsQuery = useQuery({ queryKey: ['storage-locations'], queryFn: () => listStorageLocations() });

  const orders = ordersQuery.data ?? [];
  const warehouses = (warehousesQuery.data ?? []).filter((w) => w.status === 'ACTIVE');
  const items = itemsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];

  const confirmMut = useMutation({
    mutationFn: confirmRecoveryOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recovery-orders'] }); qc.invalidateQueries({ queryKey: ['inventory'] }); setDetailId(null); show('success', 'Đã xác nhận thu hồi'); },
    onError: (err) => show('error', errMsg(err, 'Xác nhận thu hồi thất bại')),
  });

  /* ───────────── Create flow ───────────── */

  const [form, setForm] = useState({ warehouse_id: '', reason: '', note: '' });
  const [rows, setRows] = useState<FormRow[]>([newRow()]);

  function resetForm() {
    setForm({ warehouse_id: '', reason: '', note: '' });
    setRows([newRow()]);
  }

  const locationsInWarehouse = locations.filter((l) => l.warehouse_id === form.warehouse_id && l.status === 'ACTIVE');
  const rowsValid = rows.length > 0 && rows.every((r) => r.item_id && r.location_id && r.quantity > 0);

  const createMut = useMutation({ mutationFn: createRecoveryOrder, onSuccess: () => qc.invalidateQueries({ queryKey: ['recovery-orders'] }) });
  const createAndConfirmMut = useMutation({
    mutationFn: async (data: Parameters<typeof createRecoveryOrder>[0]) => {
      const order = await createRecoveryOrder(data);
      return confirmRecoveryOrder(order.recovery_id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recovery-orders'] }); qc.invalidateQueries({ queryKey: ['inventory'] }); },
  });

  function buildPayload() {
    return {
      warehouse_id: form.warehouse_id,
      reason: form.reason || undefined,
      note: form.note || undefined,
      items: rows.map((r) => ({ item_id: r.item_id, location_id: r.location_id, quantity: r.quantity })),
    };
  }

  function saveDraft() {
    if (!form.warehouse_id || !rowsValid) return;
    createMut.mutate(buildPayload(), {
      onSuccess: () => { show('success', 'Đã lưu phiếu thu hồi (nháp)'); setView('list'); resetForm(); },
      onError: (err) => show('error', errMsg(err, 'Lưu phiếu thu hồi thất bại')),
    });
  }

  function recoverNow() {
    if (!form.warehouse_id || !rowsValid) return;
    createAndConfirmMut.mutate(buildPayload(), {
      onSuccess: () => { show('success', 'Đã xác nhận thu hồi thành công'); setView('list'); resetForm(); },
      onError: (err) => show('error', errMsg(err, 'Thu hồi thất bại — phiếu đã lưu ở trạng thái Nháp, có thể xác nhận lại sau')),
    });
  }

  const saving = createMut.isPending || createAndConfirmMut.isPending;

  if (view === 'create') {
    return (
      <PageLayout
        title="Tạo phiếu thu hồi"
        subtitle="Thu hồi vật tư từ bộ phận sử dụng về kho"
        actions={<Btn variant="secondary" onClick={() => { setView('list'); resetForm(); }}>← Quay lại</Btn>}
      >
        <div className="max-w-3xl">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kho nhận lại *</label>
                <Select
                  value={form.warehouse_id}
                  onChange={(v) => { setForm({ ...form, warehouse_id: v }); setRows([newRow()]); }}
                  options={[{ value: '', label: 'Chọn kho...' }, ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do thu hồi</label>
                <Input value={form.reason} onChange={(v) => setForm({ ...form, reason: v })} placeholder="VD: Trả lại từ dự án hoàn thành" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
                <Input value={form.note} onChange={(v) => setForm({ ...form, note: v })} placeholder="Không bắt buộc" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Danh sách vật tư thu hồi</label>
                  <Btn variant="secondary" size="sm" onClick={() => setRows([...rows, newRow()])} disabled={!form.warehouse_id}>+ Thêm vật tư</Btn>
                </div>
                {!form.warehouse_id ? (
                  <p className="text-sm text-gray-400 italic">Chọn kho nhận lại trước khi thêm vật tư.</p>
                ) : (
                  <div className="space-y-2">
                    {rows.map((row) => (
                      <div key={row.key} className="flex items-center gap-2 p-3 border border-gray-100 rounded-xl">
                        <Select
                          value={row.item_id}
                          onChange={(v) => setRows(rows.map((r) => (r.key === row.key ? { ...r, item_id: v } : r)))}
                          options={[{ value: '', label: 'Chọn vật tư...' }, ...items.map((it) => ({ value: it.item_id, label: `${it.item_code} - ${it.item_name}` }))]}
                          className="flex-1 min-w-[180px]"
                        />
                        <Select
                          value={row.location_id}
                          onChange={(v) => setRows(rows.map((r) => (r.key === row.key ? { ...r, location_id: v } : r)))}
                          options={[{ value: '', label: 'Chọn vị trí...' }, ...locationsInWarehouse.map((l) => ({ value: l.location_id, label: l.location_code }))]}
                          className="w-40"
                        />
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => setRows(rows.map((r) => (r.key === row.key ? { ...r, quantity: parseInt(e.target.value) || 0 } : r)))}
                          className="w-20 px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <button
                          className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          disabled={rows.length <= 1}
                          onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Btn variant="secondary" onClick={saveDraft} disabled={!form.warehouse_id || !rowsValid || saving}>
                  {createMut.isPending ? 'Đang lưu...' : 'Lưu nháp'}
                </Btn>
                <Btn onClick={recoverNow} disabled={!form.warehouse_id || !rowsValid || saving}>
                  {createAndConfirmMut.isPending ? 'Đang xử lý...' : 'Xác nhận thu hồi'}
                </Btn>
              </div>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const detail: RecoveryOrder | null = orders.find((o) => o.recovery_id === detailId) ?? null;
  const isLoading = ordersQuery.isLoading || warehousesQuery.isLoading;

  return (
    <PageLayout
      title="Thu hồi"
      subtitle="Quản lý phiếu thu hồi vật tư từ bộ phận sử dụng"
      actions={
        canWriteRecovery ? (
          <Btn onClick={() => setView('create')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            Tạo phiếu thu hồi
          </Btn>
        ) : undefined
      }
    >
      <Card>
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
        ) : ordersQuery.error ? (
          <EmptyState title="Không tải được dữ liệu" description={errMsg(ordersQuery.error, 'Lỗi không xác định')} />
        ) : orders.length === 0 ? (
          <EmptyState title="Chưa có phiếu thu hồi nào" action={canWriteRecovery ? { label: 'Tạo phiếu đầu tiên', onClick: () => setView('create') } : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Mã phiếu</Th>
                  <Th>Ngày tạo</Th>
                  <Th>Lý do thu hồi</Th>
                  <Th>Người tạo</Th>
                  <Th className="text-right">Tổng SL</Th>
                  <Th>Trạng thái</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.recovery_id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetailId(o.recovery_id)}>
                    <Td><span className="font-mono text-sm font-semibold text-purple-600">{o.recovery_code}</span></Td>
                    <Td><span className="text-sm text-gray-500">{new Date(o.recovery_date).toLocaleString('vi-VN')}</span></Td>
                    <Td><span className="text-gray-700">{o.reason || '—'}</span></Td>
                    <Td>{o.creator.full_name}</Td>
                    <Td className="text-right font-semibold text-gray-900">{o.items.reduce((s, i) => s + i.quantity, 0)}</Td>
                    <Td><Badge color={statusConfig[o.status].color}>{statusConfig[o.status].label}</Badge></Td>
                    <Td>
                      <Btn variant="ghost" size="sm" onClick={(e) => { e?.stopPropagation(); setDetailId(o.recovery_id); }}>Xem</Btn>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetailId(null)} title="Chi tiết phiếu thu hồi" size="lg">
        {detail && (
          <>
            <p className="font-mono text-sm text-purple-600 -mt-3 mb-4">{detail.recovery_code}</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Kho nhận lại', value: detail.warehouse.warehouse_name },
                { label: 'Lý do', value: detail.reason || '—' },
                { label: 'Người tạo', value: detail.creator.full_name },
                { label: 'Ngày tạo', value: new Date(detail.recovery_date).toLocaleString('vi-VN') },
                { label: 'Tổng số lượng', value: `${detail.items.reduce((s, i) => s + i.quantity, 0)} đơn vị` },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto mb-4 border border-gray-100 rounded-xl">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Vật tư</Th>
                    <Th>Vị trí</Th>
                    <Th className="text-right">Số lượng</Th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it) => (
                    <tr key={it.recovery_item_id}>
                      <Td>{it.item.item_name} <span className="text-xs text-gray-400 font-mono">({it.item.item_code})</span></Td>
                      <Td><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{it.location.location_code}</code></Td>
                      <Td className="text-right font-semibold">{it.quantity}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <Badge color={statusConfig[detail.status].color}>{statusConfig[detail.status].label}</Badge>
              <div className="flex gap-2">
                {detail.status === 'DRAFT' && canWriteRecovery && (
                  <Btn size="sm" onClick={() => confirmMut.mutate(detail.recovery_id)} disabled={confirmMut.isPending}>
                    {confirmMut.isPending ? 'Đang xử lý...' : 'Xác nhận thu hồi'}
                  </Btn>
                )}
                <Btn variant="secondary" size="sm" onClick={() => setDetailId(null)}>Đóng</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>
    </PageLayout>
  );
}
