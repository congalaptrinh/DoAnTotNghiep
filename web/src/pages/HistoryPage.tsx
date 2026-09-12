import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageLayout, { Card, Badge, Select, Input } from '../components/PageLayout';
import { Pagination, EmptyState } from '../components/ui';
import { ApiError } from '../services/apiClient';
import { listWarehouses } from '../services/warehouse.service';
import { listItems } from '../services/item.service';
import { listStockMovements, type MovementType, type StockMovementRow } from '../services/stockMovement.service';
import { signedQuantity, MOVEMENT_LABELS } from '../hooks/useDashboardStats';

const typeConfig: Record<MovementType, { color: 'green' | 'red' | 'yellow' | 'blue' | 'indigo' | 'purple' | 'gray'; bg: string; icon: string }> = {
  IMPORT: { color: 'green', bg: 'bg-green-100 text-green-700', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  EXPORT: { color: 'red', bg: 'bg-red-100 text-red-700', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  TRANSFER_OUT: { color: 'indigo', bg: 'bg-indigo-100 text-indigo-700', icon: 'M4 12h12m0 0l-4-4m4 4l-4 4' },
  TRANSFER_IN: { color: 'blue', bg: 'bg-blue-100 text-blue-700', icon: 'M20 12H8m0 0l4-4m-4 4l4 4' },
  RECOVERY: { color: 'purple', bg: 'bg-purple-100 text-purple-700', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  ADJUSTMENT_STOCKTAKE: { color: 'yellow', bg: 'bg-yellow-100 text-yellow-700', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  LIQUIDATION: { color: 'gray', bg: 'bg-gray-100 text-gray-600', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
};

const ALL_TYPES = Object.keys(typeConfig) as MovementType[];

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

const PAGE_SIZE = 8;

export default function HistoryPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | MovementType>('all');
  const [warehouseId, setWarehouseId] = useState('');
  const [itemId, setItemId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StockMovementRow | null>(null);

  const warehousesQuery = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const itemsQuery = useQuery({ queryKey: ['items'], queryFn: () => listItems() });
  const warehouses = warehousesQuery.data ?? [];
  const items = itemsQuery.data ?? [];

  const filters = {
    item_id: itemId || undefined,
    warehouse_id: warehouseId || undefined,
    movement_type: typeFilter === 'all' ? undefined : typeFilter,
    from: fromDate || undefined,
    to: toDate || undefined,
  };

  const movementsQuery = useQuery({
    queryKey: ['stock-movements', filters],
    queryFn: () => listStockMovements(filters),
  });
  /** Backend luôn trả asc (cũ→mới, xem 07-DECISIONS-LOG.md) — KHÔNG đảo mảng ở trang này, khác các trang danh sách phiếu khác (desc), vì đây là nhật ký cần đọc theo trình tự thời gian thật. */
  const movements = movementsQuery.data ?? [];

  const totalPages = Math.max(1, Math.ceil(movements.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const paged = movements.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  function resetFilters() {
    setTypeFilter('all'); setWarehouseId(''); setItemId(''); setFromDate(''); setToDate(''); setPage(1);
  }

  return (
    <PageLayout title="Lịch sử biến động kho" subtitle="Toàn bộ giao dịch nhập-xuất-chuyển kho theo thời gian (cũ → mới)">
      {/* Loại nghiệp vụ */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => { setTypeFilter('all'); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${typeFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
        >
          Tất cả
        </button>
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => { setTypeFilter(typeFilter === type ? 'all' : type); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              typeFilter === type ? `${typeConfig[type].bg} border-current` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {MOVEMENT_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Filters: vật tư / kho / khoảng ngày */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          value={itemId}
          onChange={(v) => { setItemId(v); setPage(1); }}
          options={[{ value: '', label: 'Tất cả vật tư' }, ...items.map((it) => ({ value: it.item_id, label: `${it.item_code} - ${it.item_name}` }))]}
          className="w-56"
        />
        <Select
          value={warehouseId}
          onChange={(v) => { setWarehouseId(v); setPage(1); }}
          options={[{ value: '', label: 'Tất cả kho' }, ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))]}
          className="w-48"
        />
        <Input type="date" value={fromDate} onChange={(v) => { setFromDate(v); setPage(1); }} className="w-40" />
        <span className="text-sm text-gray-400">→</span>
        <Input type="date" value={toDate} onChange={(v) => { setToDate(v); setPage(1); }} className="w-40" />
        <button onClick={resetFilters} className="text-sm text-indigo-600 hover:underline">Xóa bộ lọc</button>
        <span className="text-sm text-gray-400 ml-auto">{movements.length} bản ghi</span>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          <Card>
            {movementsQuery.isLoading ? (
              <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
            ) : movementsQuery.error ? (
              <EmptyState title="Không tải được dữ liệu" description={errMsg(movementsQuery.error, 'Lỗi không xác định')} />
            ) : paged.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-500 font-medium">Không có bản ghi phù hợp</p>
                <button onClick={resetFilters} className="mt-2 text-sm text-indigo-600 hover:underline">Xóa bộ lọc</button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {paged.map((mv) => {
                    const cfg = typeConfig[mv.movement_type];
                    const qty = signedQuantity(mv);
                    return (
                      <div
                        key={mv.movement_id}
                        onClick={() => setSelected(selected?.movement_id === mv.movement_id ? null : mv)}
                        className={`px-5 py-4 flex items-start gap-4 hover:bg-gray-50/60 transition-colors cursor-pointer ${selected?.movement_id === mv.movement_id ? 'bg-indigo-50/40' : ''}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d={cfg.icon} />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge color={cfg.color}>{MOVEMENT_LABELS[mv.movement_type]}</Badge>
                            <span className="text-sm font-semibold text-gray-900 truncate">{mv.item.item_name}</span>
                            <span className={`text-sm font-bold ${qty > 0 ? 'text-green-600' : qty < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {qty > 0 ? `+${qty}` : qty}
                            </span>
                          </div>
                          {mv.note && <p className="text-sm text-gray-500 mt-0.5 truncate">{mv.note}</p>}
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                            <span>{new Date(mv.movement_date).toLocaleString('vi-VN')}</span>
                            <span>•</span>
                            <span>{mv.warehouse.warehouse_name}</span>
                            <span>•</span>
                            <code className="bg-gray-100 px-1 rounded">{mv.location.location_code}</code>
                            <span>•</span>
                            <span>{mv.performer.full_name}</span>
                          </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
                <Pagination page={curPage} totalPages={totalPages} totalItems={movements.length} pageSize={PAGE_SIZE} onChange={setPage} />
              </>
            )}
          </Card>
        </div>

        {selected && (
          <div className="w-64 flex-shrink-0">
            <Card className="p-5 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <Badge color={typeConfig[selected.movement_type].color}>{MOVEMENT_LABELS[selected.movement_type]}</Badge>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h3 className="font-bold text-gray-900 text-sm mb-0.5">{selected.item.item_name}</h3>
              <p className="font-mono text-xs text-gray-400 mb-4">{selected.item.item_code}</p>

              <div className="space-y-3">
                {[
                  { label: 'Thời gian', value: new Date(selected.movement_date).toLocaleString('vi-VN') },
                  { label: 'Kho', value: selected.warehouse.warehouse_name },
                  { label: 'Vị trí', value: selected.location.location_code },
                  { label: 'Người thực hiện', value: selected.performer.full_name },
                  { label: 'Số lượng', value: (() => { const q = signedQuantity(selected); return q > 0 ? `+${q}` : `${q}`; })() },
                  { label: 'Ghi chú', value: selected.note || '—' },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">{item.label}</span>
                    <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
