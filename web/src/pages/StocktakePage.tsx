import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageLayout, { Card, Badge, Btn, Select, Th, Td } from '../components/PageLayout';
import { Modal, EmptyState, useToast } from '../components/ui';
import { usePermission } from '../hooks/usePermission';
import { ApiError } from '../services/apiClient';
import { listWarehouses } from '../services/warehouse.service';
import {
  listStocktakeSessions, createStocktakeSession, updateStocktakeItems, confirmStocktakeSession,
} from '../services/stocktakeSession.service';
import type { OrderStatus } from '../services/orders.service';

const statusConfig: Record<OrderStatus, { label: string; color: 'gray' | 'green' | 'red' | 'indigo' }> = {
  DRAFT: { label: 'Đang tiến hành', color: 'indigo' },
  CONFIRMED: { label: 'Hoàn tất', color: 'green' },
  CANCELLED: { label: 'Đã huỷ', color: 'red' },
};

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function StocktakePage() {
  const { canWrite } = usePermission();
  const canWriteStocktake = canWrite('stocktake_sessions');
  const qc = useQueryClient();
  const { show } = useToast();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWarehouseId, setNewWarehouseId] = useState('');

  const sessionsQuery = useQuery({ queryKey: ['stocktake-sessions'], queryFn: () => listStocktakeSessions() });
  const warehousesQuery = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const sessions = sessionsQuery.data ?? [];
  const warehouses = (warehousesQuery.data ?? []).filter((w) => w.status === 'ACTIVE');

  const createMut = useMutation({
    mutationFn: createStocktakeSession,
    onSuccess: (session) => {
      qc.invalidateQueries({ queryKey: ['stocktake-sessions'] });
      setCreateModalOpen(false);
      setNewWarehouseId('');
      setActiveId(session.stocktake_id);
      show('success', `Đã mở phiên kiểm kê ${session.stocktake_code} — snapshot ${session.items.length} dòng tồn kho`);
    },
    onError: (err) => show('error', errMsg(err, 'Tạo phiên kiểm kê thất bại')),
  });

  /* ───────────── Màn đếm / nhập số liệu ───────────── */

  const active = sessions.find((s) => s.stocktake_id === activeId) ?? null;
  const [localQty, setLocalQty] = useState<Record<string, string>>({});

  useEffect(() => {
    if (active) {
      const seed: Record<string, string> = {};
      active.items.forEach((it) => { seed[it.stocktake_item_id] = it.actual_quantity != null ? String(it.actual_quantity) : ''; });
      setLocalQty(seed);
    }
  }, [active?.stocktake_id]);

  const saveMut = useMutation({
    mutationFn: (items: { stocktake_item_id: string; actual_quantity: number }[]) => updateStocktakeItems(active!.stocktake_id, items),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stocktake-sessions'] }); show('success', 'Đã lưu số lượng thực tế'); },
    onError: (err) => show('error', errMsg(err, 'Lưu số liệu thất bại')),
  });

  const confirmMut = useMutation({
    mutationFn: () => confirmStocktakeSession(active!.stocktake_id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stocktake-sessions'] }); qc.invalidateQueries({ queryKey: ['inventory'] }); show('success', 'Đã xác nhận kiểm kê — tồn kho đã được đặt lại theo số thực tế'); },
    onError: (err) => show('error', errMsg(err, 'Xác nhận kiểm kê thất bại')),
  });

  function saveProgress() {
    if (!active) return;
    const items = active.items
      .filter((it) => localQty[it.stocktake_item_id] !== '' && localQty[it.stocktake_item_id] !== undefined)
      .map((it) => ({ stocktake_item_id: it.stocktake_item_id, actual_quantity: parseInt(localQty[it.stocktake_item_id]) || 0 }));
    if (items.length === 0) return;
    saveMut.mutate(items);
  }

  const unfilledCount = active ? active.items.filter((it) => it.actual_quantity === null).length : 0;
  const canConfirm = !!active && active.status === 'DRAFT' && unfilledCount === 0 && canWriteStocktake;

  if (active) {
    const isDraft = active.status === 'DRAFT';
    const dư = active.items.reduce((s, it) => s + Math.max(0, it.difference ?? 0), 0);
    const thiếu = active.items.reduce((s, it) => s + Math.max(0, -(it.difference ?? 0)), 0);
    const khớp = active.items.filter((it) => it.difference === 0).length;

    return (
      <PageLayout
        title={`Kiểm kê ${active.stocktake_code} — ${active.warehouse.warehouse_name}`}
        subtitle="Đối chiếu số liệu hệ thống và thực tế"
        actions={<Btn variant="secondary" onClick={() => setActiveId(null)}>← Quay lại</Btn>}
      >
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-amber-800">
            <b>Xác nhận sẽ ĐẶT LẠI (SET) tồn kho đúng bằng "Thực tế" đã nhập ở đây cho từng vị trí — không phải cộng/trừ chênh lệch.</b>{' '}
            Cột "Hệ thống" là số liệu chụp nhanh (snapshot) tại đúng thời điểm MỞ phiên này ({new Date(active.stocktake_date).toLocaleString('vi-VN')}), không tự cập nhật theo thời gian thực.
            Nếu có nghiệp vụ khác (nhập/xuất/chuyển kho...) xảy ra ở kho này SAU khi mở phiên và TRƯỚC khi xác nhận, thay đổi đó sẽ bị GHI ĐÈ bởi số "Thực tế" khi bấm "Xác nhận kiểm kê".
          </p>
        </div>

        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge color={statusConfig[active.status].color}>{statusConfig[active.status].label}</Badge>
              <span className="text-sm text-gray-500">Người kiểm: {active.creator.full_name} • {new Date(active.stocktake_date).toLocaleDateString('vi-VN')}</span>
            </div>
            {isDraft && canWriteStocktake && (
              <div className="flex gap-2 items-center">
                {unfilledCount > 0 && <span className="text-xs text-danger font-medium">Còn {unfilledCount} dòng chưa nhập</span>}
                <Btn variant="secondary" size="sm" onClick={saveProgress} disabled={saveMut.isPending}>
                  {saveMut.isPending ? 'Đang lưu...' : 'Lưu tiến độ'}
                </Btn>
                <span title={unfilledCount > 0 ? 'Còn dòng chưa nhập số lượng thực tế — không thể xác nhận' : undefined}>
                  <Btn size="sm" onClick={() => confirmMut.mutate()} disabled={!canConfirm || confirmMut.isPending}>
                    {confirmMut.isPending ? 'Đang xử lý...' : 'Xác nhận kiểm kê (SET tồn kho)'}
                  </Btn>
                </span>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Mã SP</Th>
                  <Th>Tên vật tư</Th>
                  <Th>Vị trí</Th>
                  <Th className="text-right">Hệ thống (snapshot)</Th>
                  <Th className="text-right">Thực tế</Th>
                  <Th className="text-right">Chênh lệch</Th>
                </tr>
              </thead>
              <tbody>
                {active.items.map((it) => {
                  const diff = it.difference;
                  return (
                    <tr key={it.stocktake_item_id} className="hover:bg-gray-50/60 transition-colors">
                      <Td><span className="font-mono text-xs text-gray-500">{it.item.item_code}</span></Td>
                      <Td><span className="font-medium text-gray-900">{it.item.item_name}</span></Td>
                      <Td><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{it.location.location_code}</code></Td>
                      <Td className="text-right text-gray-700">{it.system_quantity}</Td>
                      <Td className="text-right">
                        <input
                          type="number"
                          value={localQty[it.stocktake_item_id] ?? ''}
                          disabled={!isDraft || !canWriteStocktake}
                          onChange={(e) => setLocalQty({ ...localQty, [it.stocktake_item_id]: e.target.value })}
                          placeholder="Chưa nhập"
                          className={`w-24 px-2 py-1 text-sm text-right border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400 ${
                            it.actual_quantity === null ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                        />
                      </Td>
                      <Td className="text-right">
                        <span className={`font-bold text-sm ${diff == null ? 'text-gray-300' : diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {diff == null ? '—' : diff > 0 ? `+${diff}` : diff}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100">
            <div className="flex gap-6 text-sm">
              <span className="text-gray-500">Tổng mặt hàng: <b className="text-gray-900">{active.items.length}</b></span>
              <span className="text-green-600">Dư: <b>{dư}</b></span>
              <span className="text-red-600">Thiếu: <b>{thiếu}</b></span>
              <span className="text-gray-500">Khớp: <b className="text-gray-900">{khớp}</b></span>
            </div>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Kiểm kê"
      subtitle="Quản lý các phiên kiểm kê và đối chiếu tồn kho"
      actions={
        canWriteStocktake ? (
          <Btn onClick={() => setCreateModalOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            Tạo phiên kiểm kê
          </Btn>
        ) : undefined
      }
    >
      <Card>
        {sessionsQuery.isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
        ) : sessionsQuery.error ? (
          <EmptyState title="Không tải được dữ liệu" description={errMsg(sessionsQuery.error, 'Lỗi không xác định')} />
        ) : sessions.length === 0 ? (
          <EmptyState title="Chưa có phiên kiểm kê nào" action={canWriteStocktake ? { label: 'Tạo phiên đầu tiên', onClick: () => setCreateModalOpen(true) } : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Mã phiên</Th>
                  <Th>Ngày kiểm</Th>
                  <Th>Kho</Th>
                  <Th>Người kiểm</Th>
                  <Th className="text-right">Mặt hàng</Th>
                  <Th className="text-right">Khớp</Th>
                  <Th className="text-right">Chênh lệch</Th>
                  <Th>Trạng thái</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const totalDiff = s.items.reduce((sum, it) => sum + Math.abs(it.difference ?? 0), 0);
                  const matched = s.items.filter((it) => it.difference === 0).length;
                  return (
                    <tr key={s.stocktake_id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setActiveId(s.stocktake_id)}>
                      <Td><span className="font-mono text-sm font-semibold text-yellow-600">{s.stocktake_code}</span></Td>
                      <Td><span className="text-sm text-gray-500">{new Date(s.stocktake_date).toLocaleDateString('vi-VN')}</span></Td>
                      <Td><span className="font-medium text-gray-700">{s.warehouse.warehouse_name}</span></Td>
                      <Td>{s.creator.full_name}</Td>
                      <Td className="text-right">{s.items.length}</Td>
                      <Td className="text-right text-green-600 font-semibold">{matched}</Td>
                      <Td className="text-right">
                        <span className={`font-semibold ${totalDiff > 0 ? 'text-red-600' : 'text-gray-400'}`}>{totalDiff > 0 ? totalDiff : '0'}</span>
                      </Td>
                      <Td><Badge color={statusConfig[s.status].color}>{statusConfig[s.status].label}</Badge></Td>
                      <Td>
                        <Btn variant="ghost" size="sm" onClick={(e) => { e?.stopPropagation(); setActiveId(s.stocktake_id); }}>
                          {s.status === 'DRAFT' ? 'Tiếp tục' : 'Xem'}
                        </Btn>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tạo phiên kiểm kê mới"
        footer={
          <>
            <Btn onClick={() => newWarehouseId && createMut.mutate({ warehouse_id: newWarehouseId })} disabled={!newWarehouseId || createMut.isPending}>
              {createMut.isPending ? 'Đang tạo...' : 'Mở phiên kiểm kê'}
            </Btn>
            <Btn variant="secondary" onClick={() => setCreateModalOpen(false)}>Huỷ</Btn>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kho cần kiểm kê *</label>
          <Select
            value={newWarehouseId}
            onChange={setNewWarehouseId}
            options={[{ value: '', label: 'Chọn kho...' }, ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))]}
          />
          <p className="text-xs text-gray-400 mt-2">
            Hệ thống sẽ chụp nhanh (snapshot) toàn bộ tồn kho hiện tại của kho này làm số liệu "Hệ thống" cho phiên kiểm kê.
          </p>
        </div>
      </Modal>
    </PageLayout>
  );
}
