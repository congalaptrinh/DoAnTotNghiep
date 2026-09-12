import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageLayout, { Card, Badge, Btn, Input, Select, Th, Td } from '../components/PageLayout';
import { Stepper, Modal, EmptyState } from '../components/ui';
import { usePermission } from '../hooks/usePermission';
import { ApiError } from '../services/apiClient';
import { listWarehouses } from '../services/warehouse.service';
import { listSuppliers } from '../services/supplier.service';
import { listItems } from '../services/item.service';
import { listStorageLocations } from '../services/storageLocation.service';
import { detectImage, type AiDetectResult } from '../services/ai.service';
import {
  listImportOrders, createImportOrder, createImportOrderFromAi, confirmImportOrder, type ImportOrder,
} from '../services/importOrder.service';
import type { OrderStatus } from '../services/orders.service';

const statusConfig: Record<OrderStatus, { label: string; color: 'gray' | 'green' | 'red' }> = {
  DRAFT: { label: 'Nháp', color: 'gray' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'green' },
  CANCELLED: { label: 'Đã huỷ', color: 'red' },
};

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** 1 dòng trong bảng xác nhận step 2 — bắt nguồn từ 1 nhóm `summary` (class_name + count) mà AI trả về. */
interface ConfirmRow {
  key: string;
  class_name: string;
  detectedCount: number;
  item_id: string;
  location_id: string;
  quantity: number;
}

/** 1 dòng vật tư trong form tạo phiếu nhập THƯỜNG (không qua AI). */
interface ManualRow {
  key: string;
  item_id: string;
  location_id: string;
  quantity: number;
}

let manualRowSeq = 0;
function newManualRow(): ManualRow {
  return { key: `m${manualRowSeq++}`, item_id: '', location_id: '', quantity: 1 };
}

export default function ImportPage() {
  const { canWrite } = usePermission();
  const canWriteImport = canWrite('import_orders');
  const qc = useQueryClient();

  const [view, setView] = useState<'list' | 'create' | 'manual'>('list');
  const [detailId, setDetailId] = useState<string | null>(null);

  const ordersQuery = useQuery({ queryKey: ['import-orders'], queryFn: () => listImportOrders() });
  const warehousesQuery = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: () => listSuppliers() });
  const itemsQuery = useQuery({ queryKey: ['items'], queryFn: () => listItems() });
  const locationsQuery = useQuery({ queryKey: ['storage-locations'], queryFn: () => listStorageLocations() });

  const orders = ordersQuery.data ?? [];
  const warehouses = (warehousesQuery.data ?? []).filter((w) => w.status === 'ACTIVE');
  const suppliers = (suppliersQuery.data ?? []).filter((s) => s.status === 'ACTIVE');
  const items = itemsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];

  const confirmMut = useMutation({
    mutationFn: confirmImportOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['import-orders'] }); qc.invalidateQueries({ queryKey: ['inventory'] }); setDetailId(null); },
  });

  /* ───────────── Create flow (AI 3 bước) ───────────── */

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiDetectResult | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [form, setForm] = useState({ supplier_id: '', warehouse_id: '', note: '' });
  const [rows, setRows] = useState<ConfirmRow[]>([]);
  const [created, setCreated] = useState<ImportOrder | null>(null);

  function resetCreateFlow() {
    setView('list'); setStep(1); setFile(null); setPreview(null); setAiResult(null);
    setImgSize(null); setForm({ supplier_id: '', warehouse_id: '', note: '' }); setRows([]); setCreated(null);
  }

  function handleFileChange(f: File | null) {
    setFile(f);
    setAiResult(null);
    setImgSize(null);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  const detectMut = useMutation({
    mutationFn: () => detectImage(file!),
    onSuccess: (result) => {
      setAiResult(result);
      setRows(result.summary.map((s, i) => ({
        key: `${s.class_name}-${i}`, class_name: s.class_name, detectedCount: s.count,
        item_id: '', location_id: '', quantity: s.count,
      })));
    },
  });

  const locationsInWarehouse = locations.filter((l) => l.warehouse_id === form.warehouse_id && l.status === 'ACTIVE');
  const rowsValid = rows.length > 0 && rows.every((r) => r.item_id && r.location_id && r.quantity > 0);

  const createMut = useMutation({
    mutationFn: createImportOrderFromAi,
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ['import-orders'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setCreated(order);
      setStep(3);
    },
  });

  function submitCreate() {
    if (!form.warehouse_id || !rowsValid) return;
    createMut.mutate({
      supplier_id: form.supplier_id || null,
      warehouse_id: form.warehouse_id,
      note: form.note || undefined,
      items: rows.map((r) => ({ item_id: r.item_id, location_id: r.location_id, quantity: r.quantity })),
    });
  }

  function updateRow(key: string, patch: Partial<ConfirmRow>) {
    setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function removeRow(key: string) {
    setRows(rows.filter((r) => r.key !== key));
  }

  const steps = ['Chụp ảnh / AI phân tích', 'Xác nhận danh sách', 'Hoàn tất nhập kho'];

  /* ───────────── Create flow (thường, không qua AI) ───────────── */

  const [manualForm, setManualForm] = useState({ supplier_id: '', warehouse_id: '', note: '' });
  const [manualRows, setManualRows] = useState<ManualRow[]>([newManualRow()]);

  function resetManualForm() {
    setManualForm({ supplier_id: '', warehouse_id: '', note: '' });
    setManualRows([newManualRow()]);
  }

  const manualLocationsInWarehouse = locations.filter((l) => l.warehouse_id === manualForm.warehouse_id && l.status === 'ACTIVE');
  const manualRowsValid = manualRows.length > 0 && manualRows.every((r) => r.item_id && r.location_id && r.quantity > 0);

  const manualCreateMut = useMutation({
    mutationFn: createImportOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['import-orders'] }); setView('list'); resetManualForm(); },
  });

  function submitManualCreate() {
    if (!manualForm.warehouse_id || !manualRowsValid) return;
    manualCreateMut.mutate({
      supplier_id: manualForm.supplier_id || null,
      warehouse_id: manualForm.warehouse_id,
      note: manualForm.note || undefined,
      items: manualRows.map((r) => ({ item_id: r.item_id, location_id: r.location_id, quantity: r.quantity })),
    });
  }

  if (view === 'manual') {
    return (
      <PageLayout
        title="Tạo phiếu nhập kho"
        subtitle="Nhập tay danh sách vật tư — phiếu ở trạng thái Nháp, xác nhận sau tại danh sách/chi tiết phiếu"
        actions={<Btn variant="secondary" onClick={() => { setView('list'); resetManualForm(); }}>← Quay lại</Btn>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">Thông tin phiếu</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kho nhập *</label>
                <Select
                  value={manualForm.warehouse_id}
                  onChange={(v) => { setManualForm({ ...manualForm, warehouse_id: v }); setManualRows([newManualRow()]); }}
                  options={[{ value: '', label: 'Chọn kho...' }, ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhà cung cấp</label>
                <Select
                  value={manualForm.supplier_id}
                  onChange={(v) => setManualForm({ ...manualForm, supplier_id: v })}
                  options={[{ value: '', label: 'Không chọn' }, ...suppliers.map((s) => ({ value: s.supplier_id, label: s.supplier_name }))]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
                <Input value={manualForm.note} onChange={(v) => setManualForm({ ...manualForm, note: v })} placeholder="Không bắt buộc" />
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Danh sách vật tư nhập</h3>
              <Btn variant="secondary" size="sm" onClick={() => setManualRows([...manualRows, newManualRow()])} disabled={!manualForm.warehouse_id}>+ Thêm vật tư</Btn>
            </div>

            {!manualForm.warehouse_id ? (
              <p className="text-sm text-gray-400 italic px-5 py-6">Chọn kho nhập trước khi thêm vật tư.</p>
            ) : (
              <div className="overflow-x-auto mt-2">
                <table className="w-full">
                  <thead>
                    <tr>
                      <Th>Vật tư *</Th>
                      <Th>Vị trí *</Th>
                      <Th className="text-right">Số lượng *</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualRows.map((row) => (
                      <tr key={row.key} className="hover:bg-gray-50/60 transition-colors">
                        <Td>
                          <Select
                            value={row.item_id}
                            onChange={(v) => setManualRows(manualRows.map((r) => (r.key === row.key ? { ...r, item_id: v } : r)))}
                            options={[{ value: '', label: 'Chọn vật tư...' }, ...items.map((it) => ({ value: it.item_id, label: `${it.item_code} - ${it.item_name}` }))]}
                            className="min-w-[200px]"
                          />
                        </Td>
                        <Td>
                          <Select
                            value={row.location_id}
                            onChange={(v) => setManualRows(manualRows.map((r) => (r.key === row.key ? { ...r, location_id: v } : r)))}
                            options={[{ value: '', label: 'Chọn vị trí...' }, ...manualLocationsInWarehouse.map((l) => ({ value: l.location_id, label: l.location_code }))]}
                            className="min-w-[160px]"
                          />
                        </Td>
                        <Td className="text-right">
                          <input
                            type="number"
                            value={row.quantity}
                            onChange={(e) => setManualRows(manualRows.map((r) => (r.key === row.key ? { ...r, quantity: parseInt(e.target.value) || 0 } : r)))}
                            className="w-20 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </Td>
                        <Td>
                          <button
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            disabled={manualRows.length <= 1}
                            onClick={() => setManualRows(manualRows.filter((r) => r.key !== row.key))}
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

            {manualCreateMut.isError && (
              <p className="px-5 pt-2 text-sm text-danger">{errMsg(manualCreateMut.error, 'Tạo phiếu nhập kho thất bại')}</p>
            )}

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <Btn onClick={submitManualCreate} disabled={!manualForm.warehouse_id || !manualRowsValid || manualCreateMut.isPending}>
                {manualCreateMut.isPending ? 'Đang lưu...' : 'Tạo phiếu nhập (Nháp)'}
              </Btn>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (view === 'create') {
    return (
      <PageLayout
        title="Tạo phiếu nhập kho"
        subtitle="Sử dụng AI để tự động nhận diện linh kiện qua ảnh chụp"
        actions={<Btn variant="secondary" onClick={resetCreateFlow}>← Quay lại danh sách</Btn>}
      >
        <Stepper steps={steps} current={step} />

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Ảnh chụp linh kiện</h3>
              {!aiResult ? (
                <div>
                  <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                    {preview ? (
                      <img src={preview} alt="Ảnh đã chọn" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-sm text-gray-400">Chưa chọn ảnh</span>
                    )}
                    {detectMut.isPending && (
                      <div className="absolute inset-0 bg-indigo-900/60 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-white font-semibold">AI đang phân tích...</span>
                        <span className="text-white/70 text-sm">Đang nhận diện linh kiện</span>
                      </div>
                    )}
                  </div>
                  {detectMut.isError && (
                    <p className="mt-2 text-xs text-danger">{errMsg(detectMut.error, 'Phân tích ảnh thất bại')}</p>
                  )}
                  <div className="flex gap-3 mt-4">
                    <label className="inline-flex items-center gap-2 font-medium rounded-lg transition-all px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm cursor-pointer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Tải ảnh lên
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
                    </label>
                    <Btn onClick={() => detectMut.mutate()} variant="primary" size="sm" disabled={!file || !form.warehouse_id || detectMut.isPending}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                      </svg>
                      Phân tích bằng AI
                    </Btn>
                  </div>
                  {!form.warehouse_id && <p className="text-xs text-gray-400 mt-2">Chọn kho nhập trước khi phân tích ảnh.</p>}
                </div>
              ) : (
                <div>
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={aiResult.annotated_image}
                      alt="Kết quả AI nhận diện"
                      className="w-full h-auto rounded-xl"
                      onLoad={(e) => setImgSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                    />
                    {imgSize && (
                      <div className="absolute inset-0">
                        {aiResult.detections.map((d, i) => (
                          <div
                            key={i}
                            className="absolute border-2 border-green-400 rounded pointer-events-none"
                            style={{
                              left: `${(d.bounding_box.x / imgSize.w) * 100}%`,
                              top: `${(d.bounding_box.y / imgSize.h) * 100}%`,
                              width: `${(d.bounding_box.width / imgSize.w) * 100}%`,
                              height: `${(d.bounding_box.height / imgSize.h) * 100}%`,
                            }}
                          >
                            <span className="absolute -top-5 left-0 bg-green-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                              {d.class_name} {Math.round(d.confidence * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 bg-indigo-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      AI: {aiResult.summary.length} loại • {aiResult.detections.length} vật thể
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiResult.summary.map((s) => (
                      <span key={s.class_name} className="text-xs border-2 border-indigo-300 px-2 py-1 rounded-lg font-semibold text-gray-700">
                        {s.class_name} ×{s.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Thông tin phiếu</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhà cung cấp</label>
                  <Select
                    value={form.supplier_id}
                    onChange={(v) => setForm({ ...form, supplier_id: v })}
                    options={[{ value: '', label: 'Không chọn' }, ...suppliers.map((s) => ({ value: s.supplier_id, label: s.supplier_name }))]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Kho nhập *</label>
                  <Select
                    value={form.warehouse_id}
                    onChange={(v) => setForm({ ...form, warehouse_id: v })}
                    disabled={!!aiResult}
                    options={[{ value: '', label: 'Chọn kho...' }, ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
                  <Input value={form.note} onChange={(v) => setForm({ ...form, note: v })} placeholder="Nhập ghi chú..." />
                </div>
              </div>
              <div className="mt-6">
                {aiResult ? (
                  <Btn onClick={() => setStep(2)}>Tiếp theo: Xác nhận danh sách →</Btn>
                ) : (
                  <p className="text-sm text-gray-400 italic">Tải ảnh lên và nhấn "Phân tích bằng AI" để tiếp tục</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {step === 2 && (
          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Xác nhận danh sách vật tư nhập kho</h3>
              <Badge color="green">AI phát hiện {rows.length} nhóm</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Nhãn AI</Th>
                    <Th>Vật tư thật *</Th>
                    <Th className="text-right">Số lượng</Th>
                    <Th>Vị trí lưu kho *</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="hover:bg-gray-50/60 transition-colors">
                      <Td>
                        <span className="font-medium text-gray-900">{row.class_name}</span>
                        <span className="text-xs text-gray-400 ml-1">(AI: {row.detectedCount})</span>
                      </Td>
                      <Td>
                        <Select
                          value={row.item_id}
                          onChange={(v) => updateRow(row.key, { item_id: v })}
                          error={!row.item_id ? ' ' : undefined}
                          options={[{ value: '', label: 'Chọn vật tư...' }, ...items.map((it) => ({ value: it.item_id, label: `${it.item_code} - ${it.item_name}` }))]}
                          className="min-w-[220px]"
                        />
                      </Td>
                      <Td className="text-right">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.key, { quantity: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </Td>
                      <Td>
                        <Select
                          value={row.location_id}
                          onChange={(v) => updateRow(row.key, { location_id: v })}
                          error={!row.location_id ? ' ' : undefined}
                          options={[{ value: '', label: 'Chọn vị trí...' }, ...locationsInWarehouse.map((l) => ({ value: l.location_id, label: l.location_code }))]}
                          className="min-w-[160px]"
                        />
                      </Td>
                      <Td>
                        <button className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" onClick={() => removeRow(row.key)} title="Bỏ dòng này">
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
            {createMut.isError && (
              <p className="px-5 pt-3 text-sm text-danger">{errMsg(createMut.error, 'Tạo phiếu nhập kho thất bại')}</p>
            )}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <Btn variant="secondary" onClick={() => setStep(1)}>← Quay lại</Btn>
              <Btn onClick={submitCreate} disabled={!rowsValid || createMut.isPending}>
                {createMut.isPending ? 'Đang xử lý...' : 'Hoàn tất nhập kho →'}
              </Btn>
            </div>
          </Card>
        )}

        {step === 3 && created && (
          <div className="max-w-lg mx-auto">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nhập kho thành công!</h3>
              <p className="text-gray-500 mb-1">Phiếu nhập kho <b className="text-gray-900">{created.import_code}</b> đã được tạo</p>
              <p className="text-gray-500 mb-6">
                {created.items.length} mặt hàng • {created.items.reduce((s, i) => s + i.quantity, 0)} đơn vị đã được nhập vào {created.warehouse.warehouse_name}
              </p>
              <div className="flex gap-3 justify-center">
                <Btn variant="secondary" onClick={resetCreateFlow}>Về danh sách phiếu</Btn>
                <Btn onClick={() => { setStep(1); setFile(null); setPreview(null); setAiResult(null); setImgSize(null); setRows([]); setCreated(null); }}>
                  Tạo phiếu mới
                </Btn>
              </div>
            </Card>
          </div>
        )}
      </PageLayout>
    );
  }

  const detail = orders.find((o) => o.import_id === detailId) ?? null;
  const isLoading = ordersQuery.isLoading || warehousesQuery.isLoading;

  return (
    <PageLayout
      title="Nhập kho"
      subtitle="Quản lý phiếu nhập kho, hỗ trợ AI nhận diện linh kiện tự động"
      actions={
        canWriteImport ? (
          <>
            <Btn variant="secondary" onClick={() => setView('manual')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7-7 7 7" />
              </svg>
              Tạo phiếu nhập
            </Btn>
            <Btn onClick={() => setView('create')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              Nhập kho bằng AI
            </Btn>
          </>
        ) : undefined
      }
    >
      <Card>
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
        ) : ordersQuery.error ? (
          <EmptyState title="Không tải được dữ liệu" description={errMsg(ordersQuery.error, 'Lỗi không xác định')} />
        ) : orders.length === 0 ? (
          <EmptyState title="Chưa có phiếu nhập kho nào" action={canWriteImport ? { label: 'Tạo phiếu đầu tiên', onClick: () => setView('manual') } : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Mã phiếu</Th>
                  <Th>Ngày tạo</Th>
                  <Th>Nhà cung cấp</Th>
                  <Th>Người tạo</Th>
                  <Th className="text-right">Số mặt hàng</Th>
                  <Th className="text-right">Tổng SL</Th>
                  <Th>Trạng thái</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.import_id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetailId(o.import_id)}>
                    <Td><span className="font-mono text-sm font-semibold text-indigo-600">{o.import_code}</span></Td>
                    <Td><span className="text-sm text-gray-500">{new Date(o.import_date).toLocaleString('vi-VN')}</span></Td>
                    <Td><span className="font-medium text-gray-900">{o.supplier?.supplier_name ?? '—'}</span></Td>
                    <Td>{o.creator.full_name}</Td>
                    <Td className="text-right">{o.items.length}</Td>
                    <Td className="text-right font-semibold text-gray-900">{o.items.reduce((s, i) => s + i.quantity, 0)}</Td>
                    <Td><Badge color={statusConfig[o.status].color}>{statusConfig[o.status].label}</Badge></Td>
                    <Td>
                      <Btn variant="ghost" size="sm" onClick={(e) => { e?.stopPropagation(); setDetailId(o.import_id); }}>Xem</Btn>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetailId(null)} title="Chi tiết phiếu nhập kho" size="lg">
        {detail && (
          <>
            <p className="font-mono text-sm text-indigo-600 -mt-3 mb-4">{detail.import_code}</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Nhà cung cấp', value: detail.supplier?.supplier_name ?? '—' },
                { label: 'Kho nhập', value: detail.warehouse.warehouse_name },
                { label: 'Người tạo', value: detail.creator.full_name },
                { label: 'Ngày tạo', value: new Date(detail.import_date).toLocaleString('vi-VN') },
                { label: 'Số mặt hàng', value: `${detail.items.length} loại` },
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
                    <tr key={it.import_item_id}>
                      <Td>{it.item.item_name} <span className="text-xs text-gray-400 font-mono">({it.item.item_code})</span></Td>
                      <Td><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{it.location.location_code}</code></Td>
                      <Td className="text-right font-semibold">{it.quantity}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {confirmMut.isError && (
              <p className="text-sm text-danger mb-3">{errMsg(confirmMut.error, 'Xác nhận nhập kho thất bại')}</p>
            )}

            <div className="flex justify-between items-center">
              <Badge color={statusConfig[detail.status].color}>{statusConfig[detail.status].label}</Badge>
              <div className="flex gap-2">
                {detail.status === 'DRAFT' && canWriteImport && (
                  <Btn size="sm" onClick={() => confirmMut.mutate(detail.import_id)} disabled={confirmMut.isPending}>
                    {confirmMut.isPending ? 'Đang xử lý...' : 'Xác nhận nhập kho'}
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
