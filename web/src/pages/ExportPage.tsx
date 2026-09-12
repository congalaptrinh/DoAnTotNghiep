import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageLayout, { Card, Badge, Btn, Input, Select, Th, Td } from '../components/PageLayout';
import { Modal, EmptyState, useToast } from '../components/ui';
import { usePermission } from '../hooks/usePermission';
import { ApiError } from '../services/apiClient';
import { listWarehouses } from '../services/warehouse.service';
import { listItems } from '../services/item.service';
import { listStorageLocations } from '../services/storageLocation.service';
import { listInventory } from '../services/inventory.service';
import {
  listExportOrders, createExportOrder, confirmExportOrder, type ExportOrder,
} from '../services/exportOrder.service';
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

export default function ExportPage() {
  const { canWrite } = usePermission();
  const canWriteExport = canWrite('export_orders');
  const qc = useQueryClient();
  const { show } = useToast();

  const [view, setView] = useState<'list' | 'create'>('list');
  const [detailId, setDetailId] = useState<string | null>(null);

  const ordersQuery = useQuery({ queryKey: ['export-orders'], queryFn: () => listExportOrders() });
  const warehousesQuery = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const itemsQuery = useQuery({ queryKey: ['items'], queryFn: () => listItems() });
  const locationsQuery = useQuery({ queryKey: ['storage-locations'], queryFn: () => listStorageLocations() });

  const orders = ordersQuery.data ?? [];
  const warehouses = (warehousesQuery.data ?? []).filter((w) => w.status === 'ACTIVE');
  const items = itemsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];

  const confirmMut = useMutation({
    mutationFn: confirmExportOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['export-orders'] }); qc.invalidateQueries({ queryKey: ['inventory'] }); setDetailId(null); show('success', 'Đã xác nhận xuất kho'); },
    onError: (err) => show('error', errMsg(err, 'Xác nhận xuất kho thất bại')),
  });

  /* ───────────── Create flow ───────────── */

  const [form, setForm] = useState({ warehouse_id: '', purpose: '', project_name: '', note: '' });
  const [rows, setRows] = useState<FormRow[]>([newRow()]);

  const inventoryQuery = useQuery({
    queryKey: ['inventory', 'by-warehouse', form.warehouse_id],
    queryFn: () => listInventory({ warehouse_id: form.warehouse_id }),
    enabled: !!form.warehouse_id,
  });
  const inventory = inventoryQuery.data ?? [];
  const locationsInWarehouse = locations.filter((l) => l.warehouse_id === form.warehouse_id && l.status === 'ACTIVE');

  function availableFor(item_id: string, location_id: string): number | null {
    if (!item_id || !location_id) return null;
    const row = inventory.find((r) => r.item_id === item_id && r.location_id === location_id);
    return row?.available_quantity ?? 0;
  }

  function resetCreateForm() {
    setForm({ warehouse_id: '', purpose: '', project_name: '', note: '' });
    setRows([newRow()]);
  }

  const rowsValid = rows.length > 0 && rows.every((r) => r.item_id && r.location_id && r.quantity > 0);

  const createMut = useMutation({
    mutationFn: createExportOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['export-orders'] }); },
  });

  const createAndConfirmMut = useMutation({
    mutationFn: async (data: Parameters<typeof createExportOrder>[0]) => {
      const order = await createExportOrder(data);
      return confirmExportOrder(order.export_id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['export-orders'] }); qc.invalidateQueries({ queryKey: ['inventory'] }); },
  });

  function buildPayload() {
    return {
      warehouse_id: form.warehouse_id,
      purpose: form.purpose || undefined,
      project_name: form.project_name || undefined,
      note: form.note || undefined,
      items: rows.map((r) => ({ item_id: r.item_id, location_id: r.location_id, quantity: r.quantity })),
    };
  }

  function saveDraft() {
    if (!form.warehouse_id || !rowsValid) return;
    createMut.mutate(buildPayload(), {
      onSuccess: () => { show('success', 'Đã lưu phiếu xuất (nháp)'); setView('list'); resetCreateForm(); },
      onError: (err) => show('error', errMsg(err, 'Lưu phiếu xuất thất bại')),
    });
  }

  function exportNow() {
    if (!form.warehouse_id || !rowsValid) return;
    createAndConfirmMut.mutate(buildPayload(), {
      onSuccess: () => { show('success', 'Đã xuất kho thành công'); setView('list'); resetCreateForm(); },
      onError: (err) => show('error', errMsg(err, 'Xuất kho thất bại — phiếu đã được lưu ở trạng thái Nháp, có thể xác nhận lại sau')),
    });
  }

  const saving = createMut.isPending || createAndConfirmMut.isPending;

  if (view === 'create') {
    return (
      <PageLayout
        title="Tạo phiếu xuất kho"
        subtitle="Xuất kho theo yêu cầu sử dụng"
        actions={<Btn variant="secondary" onClick={() => { setView('list'); resetCreateForm(); }}>← Quay lại</Btn>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">Thông tin phiếu xuất</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kho xuất *</label>
                <Select
                  value={form.warehouse_id}
                  onChange={(v) => { setForm({ ...form, warehouse_id: v }); setRows([newRow()]); }}
                  options={[{ value: '', label: 'Chọn kho...' }, ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Người/bộ phận nhận</label>
                <Input value={form.project_name} onChange={(v) => setForm({ ...form, project_name: v })} placeholder="VD: Lab IoT - Khoa CNTT" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mục đích sử dụng</label>
                <Input value={form.purpose} onChange={(v) => setForm({ ...form, purpose: v })} placeholder="VD: Bài thực hành IoT tháng 9" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
                <Input value={form.note} onChange={(v) => setForm({ ...form, note: v })} placeholder="Không bắt buộc" />
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Danh sách vật tư xuất</h3>
              <Btn variant="secondary" size="sm" onClick={() => setRows([...rows, newRow()])} disabled={!form.warehouse_id}>+ Thêm vật tư</Btn>
            </div>

            {!form.warehouse_id ? (
              <p className="text-sm text-gray-400 italic px-5 py-6">Chọn kho xuất trước khi thêm vật tư.</p>
            ) : (
              <div className="overflow-x-auto mt-2">
                <table className="w-full">
                  <thead>
                    <tr>
                      <Th>Vật tư *</Th>
                      <Th>Vị trí *</Th>
                      <Th className="text-right">Tồn khả dụng</Th>
                      <Th className="text-right">Số lượng *</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const avail = availableFor(row.item_id, row.location_id);
                      const insufficient = avail !== null && row.quantity > avail;
                      return (
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
                              value={row.location_id}
                              onChange={(v) => setRows(rows.map((r) => (r.key === row.key ? { ...r, location_id: v } : r)))}
                              options={[{ value: '', label: 'Chọn vị trí...' }, ...locationsInWarehouse.map((l) => ({ value: l.location_id, label: l.location_code }))]}
                              className="min-w-[160px]"
                            />
                          </Td>
                          <Td className="text-right">
                            <span className={insufficient ? 'text-danger font-semibold' : 'text-gray-500'}>{avail ?? '—'}</span>
                          </Td>
                          <Td className="text-right">
                            <input
                              type="number"
                              value={row.quantity}
                              onChange={(e) => setRows(rows.map((r) => (r.key === row.key ? { ...r, quantity: parseInt(e.target.value) || 0 } : r)))}
                              className={`w-20 px-2 py-1 text-sm text-right border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${insufficient ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {(rows.some((r) => { const a = availableFor(r.item_id, r.location_id); return a !== null && r.quantity > a; })) && (
              <div className="mx-5 mt-2 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm font-semibold text-red-700">Có dòng yêu cầu vượt tồn kho khả dụng — Backend sẽ từ chối khi bấm "Xuất kho ngay".</p>
              </div>
            )}

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <Btn variant="secondary" onClick={saveDraft} disabled={!form.warehouse_id || !rowsValid || saving}>
                {createMut.isPending ? 'Đang lưu...' : 'Lưu nháp'}
              </Btn>
              <Btn onClick={exportNow} disabled={!form.warehouse_id || !rowsValid || saving}>
                {createAndConfirmMut.isPending ? 'Đang xử lý...' : 'Xuất kho ngay'}
              </Btn>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const detail: ExportOrder | null = orders.find((o) => o.export_id === detailId) ?? null;
  const isLoading = ordersQuery.isLoading || warehousesQuery.isLoading;

  return (
    <PageLayout
      title="Xuất kho"
      subtitle="Quản lý phiếu xuất kho theo yêu cầu sử dụng"
      actions={
        canWriteExport ? (
          <Btn onClick={() => setView('create')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            Tạo phiếu xuất
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
          <EmptyState title="Chưa có phiếu xuất kho nào" action={canWriteExport ? { label: 'Tạo phiếu đầu tiên', onClick: () => setView('create') } : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Mã phiếu</Th>
                  <Th>Ngày tạo</Th>
                  <Th>Người/bộ phận nhận</Th>
                  <Th>Mục đích</Th>
                  <Th>Người tạo</Th>
                  <Th className="text-right">Tổng SL</Th>
                  <Th>Trạng thái</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.export_id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetailId(o.export_id)}>
                    <Td><span className="font-mono text-sm font-semibold text-violet-600">{o.export_code}</span></Td>
                    <Td><span className="text-sm text-gray-500">{new Date(o.export_date).toLocaleString('vi-VN')}</span></Td>
                    <Td><span className="font-medium text-gray-900">{o.project_name || '—'}</span></Td>
                    <Td><span className="text-gray-500 text-sm truncate max-w-[160px] block">{o.purpose || '—'}</span></Td>
                    <Td>{o.requester.full_name}</Td>
                    <Td className="text-right font-semibold text-gray-900">{o.items.reduce((s, i) => s + i.quantity, 0)}</Td>
                    <Td><Badge color={statusConfig[o.status].color}>{statusConfig[o.status].label}</Badge></Td>
                    <Td>
                      <Btn variant="ghost" size="sm" onClick={(e) => { e?.stopPropagation(); setDetailId(o.export_id); }}>Xem</Btn>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetailId(null)} title="Chi tiết phiếu xuất kho" size="lg">
        {detail && (
          <>
            <p className="font-mono text-sm text-violet-600 -mt-3 mb-4">{detail.export_code}</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Người nhận', value: detail.project_name || '—' },
                { label: 'Mục đích', value: detail.purpose || '—' },
                { label: 'Kho xuất', value: detail.warehouse.warehouse_name },
                { label: 'Người tạo', value: detail.requester.full_name },
                { label: 'Ngày tạo', value: new Date(detail.export_date).toLocaleString('vi-VN') },
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
                    <tr key={it.export_item_id}>
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
                {detail.status === 'DRAFT' && canWriteExport && (
                  <Btn size="sm" onClick={() => confirmMut.mutate(detail.export_id)} disabled={confirmMut.isPending}>
                    {confirmMut.isPending ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
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
