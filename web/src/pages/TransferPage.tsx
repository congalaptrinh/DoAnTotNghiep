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
  listTransferOrders, createTransferOrder, confirmTransferOrder, type TransferOrder,
} from '../services/transferOrder.service';
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
  from_location_id: string;
  to_location_id: string;
  quantity: number;
}

let rowSeq = 0;
function newRow(): FormRow {
  return { key: `r${rowSeq++}`, item_id: '', from_location_id: '', to_location_id: '', quantity: 1 };
}

export default function TransferPage() {
  const { canWrite } = usePermission();
  const canWriteTransfer = canWrite('transfer_orders');
  const qc = useQueryClient();
  const { show } = useToast();

  const [view, setView] = useState<'list' | 'create'>('list');
  const [detailId, setDetailId] = useState<string | null>(null);

  const ordersQuery = useQuery({ queryKey: ['transfer-orders'], queryFn: () => listTransferOrders() });
  const warehousesQuery = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const itemsQuery = useQuery({ queryKey: ['items'], queryFn: () => listItems() });
  const locationsQuery = useQuery({ queryKey: ['storage-locations'], queryFn: () => listStorageLocations() });

  const orders = ordersQuery.data ?? [];
  const warehouses = (warehousesQuery.data ?? []).filter((w) => w.status === 'ACTIVE');
  const items = itemsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];

  const confirmMut = useMutation({
    mutationFn: confirmTransferOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transfer-orders'] }); qc.invalidateQueries({ queryKey: ['inventory'] }); setDetailId(null); show('success', 'Đã xác nhận chuyển kho'); },
    onError: (err) => show('error', errMsg(err, 'Xác nhận chuyển kho thất bại')),
  });

  /* ───────────── Create flow ───────────── */

  const [form, setForm] = useState({ from_warehouse_id: '', to_warehouse_id: '', note: '' });
  const [rows, setRows] = useState<FormRow[]>([newRow()]);

  function resetForm() {
    setForm({ from_warehouse_id: '', to_warehouse_id: '', note: '' });
    setRows([newRow()]);
  }

  const fromLocations = locations.filter((l) => l.warehouse_id === form.from_warehouse_id && l.status === 'ACTIVE');
  const toLocations = locations.filter((l) => l.warehouse_id === form.to_warehouse_id && l.status === 'ACTIVE');
  const rowsValid = rows.length > 0 && rows.every((r) => r.item_id && r.from_location_id && r.to_location_id && r.quantity > 0);
  const warehousesValid = !!form.from_warehouse_id && !!form.to_warehouse_id;

  const createMut = useMutation({ mutationFn: createTransferOrder, onSuccess: () => qc.invalidateQueries({ queryKey: ['transfer-orders'] }) });
  const createAndConfirmMut = useMutation({
    mutationFn: async (data: Parameters<typeof createTransferOrder>[0]) => {
      const order = await createTransferOrder(data);
      return confirmTransferOrder(order.transfer_id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transfer-orders'] }); qc.invalidateQueries({ queryKey: ['inventory'] }); },
  });

  function buildPayload() {
    return {
      from_warehouse_id: form.from_warehouse_id,
      to_warehouse_id: form.to_warehouse_id,
      note: form.note || undefined,
      items: rows.map((r) => ({ item_id: r.item_id, from_location_id: r.from_location_id, to_location_id: r.to_location_id, quantity: r.quantity })),
    };
  }

  function saveDraft() {
    if (!warehousesValid || !rowsValid) return;
    createMut.mutate(buildPayload(), {
      onSuccess: () => { show('success', 'Đã lưu phiếu chuyển kho (nháp)'); setView('list'); resetForm(); },
      onError: (err) => show('error', errMsg(err, 'Lưu phiếu chuyển kho thất bại')),
    });
  }

  function transferNow() {
    if (!warehousesValid || !rowsValid) return;
    createAndConfirmMut.mutate(buildPayload(), {
      onSuccess: () => { show('success', 'Đã chuyển kho thành công'); setView('list'); resetForm(); },
      onError: (err) => show('error', errMsg(err, 'Chuyển kho thất bại — phiếu đã lưu ở trạng thái Nháp, có thể xác nhận lại sau')),
    });
  }

  const saving = createMut.isPending || createAndConfirmMut.isPending;

  if (view === 'create') {
    return (
      <PageLayout
        title="Tạo phiếu chuyển kho"
        subtitle="Di chuyển vật tư giữa các kho"
        actions={<Btn variant="secondary" onClick={() => { setView('list'); resetForm(); }}>← Quay lại</Btn>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="p-5 lg:col-span-2 border-2 border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 text-xs font-bold">N</span>
              </div>
              <h3 className="font-semibold text-gray-900">Kho nguồn</h3>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kho xuất *</label>
            <Select
              value={form.from_warehouse_id}
              onChange={(v) => { setForm({ ...form, from_warehouse_id: v }); setRows([newRow()]); }}
              options={[{ value: '', label: 'Chọn kho nguồn...' }, ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))]}
            />
          </Card>

          <div className="lg:col-span-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-indigo-400">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-indigo-400 hidden lg:block">CHUYỂN ĐẾN</span>
            </div>
          </div>

          <Card className="p-5 lg:col-span-2 border-2 border-green-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">Đ</span>
              </div>
              <h3 className="font-semibold text-gray-900">Kho đích</h3>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kho nhận *</label>
            <Select
              value={form.to_warehouse_id}
              onChange={(v) => { setForm({ ...form, to_warehouse_id: v }); setRows(rows.map((r) => ({ ...r, to_location_id: '' }))); }}
              options={[{ value: '', label: 'Chọn kho đích...' }, ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))]}
            />
            <label className="block text-sm font-medium text-gray-700 mb-1.5 mt-4">Ghi chú / Lý do chuyển kho</label>
            <Input value={form.note} onChange={(v) => setForm({ ...form, note: v })} placeholder="Không bắt buộc" />
          </Card>
        </div>

        <Card className="mt-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Danh sách vật tư chuyển</h3>
            <Btn variant="secondary" size="sm" onClick={() => setRows([...rows, newRow()])} disabled={!warehousesValid}>+ Thêm vật tư</Btn>
          </div>

          {!warehousesValid ? (
            <p className="text-sm text-gray-400 italic px-5 py-6">Chọn đủ kho nguồn và kho đích trước khi thêm vật tư.</p>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Vật tư *</Th>
                    <Th className="text-indigo-500">Vị trí nguồn *</Th>
                    <Th className="text-green-600">Vị trí đích *</Th>
                    <Th className="text-right">Số lượng *</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="hover:bg-gray-50/60 transition-colors">
                      <Td>
                        <Select
                          value={row.item_id}
                          onChange={(v) => setRows(rows.map((r) => (r.key === row.key ? { ...r, item_id: v } : r)))}
                          options={[{ value: '', label: 'Chọn vật tư...' }, ...items.map((it) => ({ value: it.item_id, label: `${it.item_code} - ${it.item_name}` }))]}
                          className="min-w-[200px]"
                        />
                      </Td>
                      <Td>
                        <Select
                          value={row.from_location_id}
                          onChange={(v) => setRows(rows.map((r) => (r.key === row.key ? { ...r, from_location_id: v } : r)))}
                          options={[{ value: '', label: 'Chọn vị trí nguồn...' }, ...fromLocations.map((l) => ({ value: l.location_id, label: l.location_code }))]}
                          className="min-w-[160px]"
                        />
                      </Td>
                      <Td>
                        <Select
                          value={row.to_location_id}
                          onChange={(v) => setRows(rows.map((r) => (r.key === row.key ? { ...r, to_location_id: v } : r)))}
                          options={[{ value: '', label: 'Chọn vị trí đích...' }, ...toLocations.map((l) => ({ value: l.location_id, label: l.location_code }))]}
                          className="min-w-[160px]"
                        />
                      </Td>
                      <Td className="text-right">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => setRows(rows.map((r) => (r.key === row.key ? { ...r, quantity: parseInt(e.target.value) || 0 } : r)))}
                          className="w-20 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </Td>
                      <Td>
                        <button
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          disabled={rows.length <= 1}
                          onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Btn variant="secondary" onClick={saveDraft} disabled={!warehousesValid || !rowsValid || saving}>
              {createMut.isPending ? 'Đang lưu...' : 'Lưu nháp'}
            </Btn>
            <Btn onClick={transferNow} disabled={!warehousesValid || !rowsValid || saving}>
              {createAndConfirmMut.isPending ? 'Đang xử lý...' : 'Chuyển kho ngay'}
            </Btn>
          </div>
        </Card>
      </PageLayout>
    );
  }

  const detail: TransferOrder | null = orders.find((o) => o.transfer_id === detailId) ?? null;
  const isLoading = ordersQuery.isLoading || warehousesQuery.isLoading;

  return (
    <PageLayout
      title="Chuyển kho"
      subtitle="Quản lý phiếu chuyển vật tư giữa các kho"
      actions={
        canWriteTransfer ? (
          <Btn onClick={() => setView('create')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            Tạo phiếu chuyển
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
          <EmptyState title="Chưa có phiếu chuyển kho nào" action={canWriteTransfer ? { label: 'Tạo phiếu đầu tiên', onClick: () => setView('create') } : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Mã phiếu</Th>
                  <Th>Ngày tạo</Th>
                  <Th>Kho nguồn</Th>
                  <Th></Th>
                  <Th>Kho đích</Th>
                  <Th>Người tạo</Th>
                  <Th className="text-right">Tổng SL</Th>
                  <Th>Trạng thái</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.transfer_id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetailId(o.transfer_id)}>
                    <Td><span className="font-mono text-sm font-semibold text-blue-600">{o.transfer_code}</span></Td>
                    <Td><span className="text-sm text-gray-500">{new Date(o.transfer_date).toLocaleString('vi-VN')}</span></Td>
                    <Td><Badge color="indigo">{o.from_warehouse.warehouse_name}</Badge></Td>
                    <Td>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Td>
                    <Td><Badge color="green">{o.to_warehouse.warehouse_name}</Badge></Td>
                    <Td>{o.creator.full_name}</Td>
                    <Td className="text-right font-semibold text-gray-900">{o.items.reduce((s, i) => s + i.quantity, 0)}</Td>
                    <Td><Badge color={statusConfig[o.status].color}>{statusConfig[o.status].label}</Badge></Td>
                    <Td>
                      <Btn variant="ghost" size="sm" onClick={(e) => { e?.stopPropagation(); setDetailId(o.transfer_id); }}>Xem</Btn>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetailId(null)} title="Chi tiết phiếu chuyển kho" size="lg">
        {detail && (
          <>
            <p className="font-mono text-sm text-blue-600 -mt-3 mb-4">{detail.transfer_code}</p>
            <div className="flex items-center gap-3 mb-5">
              <Badge color="indigo">{detail.from_warehouse.warehouse_name}</Badge>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <Badge color="green">{detail.to_warehouse.warehouse_name}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Người tạo', value: detail.creator.full_name },
                { label: 'Ngày tạo', value: new Date(detail.transfer_date).toLocaleString('vi-VN') },
                { label: 'Tổng số lượng', value: `${detail.items.reduce((s, i) => s + i.quantity, 0)} đơn vị` },
                { label: 'Ghi chú', value: detail.note || '—' },
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
                    <Th className="text-indigo-500">Vị trí nguồn</Th>
                    <Th className="text-green-600">Vị trí đích</Th>
                    <Th className="text-right">Số lượng</Th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it) => (
                    <tr key={it.transfer_item_id}>
                      <Td>{it.item.item_name} <span className="text-xs text-gray-400 font-mono">({it.item.item_code})</span></Td>
                      <Td><code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs">{it.from_location.location_code}</code></Td>
                      <Td><code className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs">{it.to_location.location_code}</code></Td>
                      <Td className="text-right font-semibold">{it.quantity}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <Badge color={statusConfig[detail.status].color}>{statusConfig[detail.status].label}</Badge>
              <div className="flex gap-2">
                {detail.status === 'DRAFT' && canWriteTransfer && (
                  <Btn size="sm" onClick={() => confirmMut.mutate(detail.transfer_id)} disabled={confirmMut.isPending}>
                    {confirmMut.isPending ? 'Đang xử lý...' : 'Xác nhận chuyển kho'}
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
