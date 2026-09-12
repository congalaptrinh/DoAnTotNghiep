import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Page } from '../types';
import PageLayout, { Card, Badge, Btn, Input, Select, Th, Td } from '../components/PageLayout';
import { Pagination, EmptyState, StatCard } from '../components/ui';
import { listInventory, type InventoryRow } from '../services/inventory.service';
import { listWarehouses } from '../services/warehouse.service';
import { ApiError } from '../services/apiClient';

type StockStatus = 'ok' | 'low' | 'out';

function stockStatus(row: InventoryRow): StockStatus {
  if (row.available_quantity <= 0) return 'out';
  if (row.available_quantity <= row.item.min_stock) return 'low';
  return 'ok';
}

const statusConfig: Record<StockStatus, { label: string; color: 'green' | 'yellow' | 'red' }> = {
  ok: { label: 'Bình thường', color: 'green' },
  low: { label: 'Sắp hết', color: 'yellow' },
  out: { label: 'Thiếu hàng', color: 'red' },
};

const PAGE_SIZE = 7;

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const onNavigate = (page: Page) => navigate(`/${page}`);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InventoryRow | null>(null);

  const inventoryQuery = useQuery({ queryKey: ['inventory'], queryFn: () => listInventory() });
  const warehousesQuery = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });

  const data = inventoryQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];

  const filtered = data.filter((row) => {
    const st = stockStatus(row);
    const matchSearch = search === '' || row.item.item_name.toLowerCase().includes(search.toLowerCase()) || row.item.item_code.toLowerCase().includes(search.toLowerCase());
    const matchWh = warehouseFilter === 'all' || row.warehouse_id === warehouseFilter;
    const matchSt = status === 'all' || st === status;
    return matchSearch && matchWh && matchSt;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const lowCount = data.filter((r) => stockStatus(r) === 'low').length;
  const outCount = data.filter((r) => stockStatus(r) === 'out').length;

  if (inventoryQuery.isLoading || warehousesQuery.isLoading) {
    return <div className="p-6 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>;
  }
  if (inventoryQuery.error) {
    return <div className="p-6"><EmptyState title="Không tải được dữ liệu tồn kho" description={errMsg(inventoryQuery.error, 'Lỗi không xác định')} /></div>;
  }

  return (
    <PageLayout
      title="Tồn kho"
      subtitle="Theo dõi số lượng và trạng thái tồn kho theo thời gian thực"
      actions={
        <Btn onClick={() => onNavigate('import')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          Tạo phiếu nhập
        </Btn>
      }
    >
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Tổng dòng tồn kho" value={data.length} color="brand" onClick={() => setStatus('all')} />
        <StatCard label="Sắp hết hàng" value={lowCount} color="warning" onClick={() => setStatus('low')} />
        <StatCard label="Thiếu hàng" value={outCount} color="danger" onClick={() => setStatus('out')} />
      </div>

      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          <Card>
            {/* Filters */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <Input
                placeholder="Tìm theo mã hoặc tên vật tư..."
                value={search}
                onChange={(v) => { setSearch(v); setPage(1); }}
                className="w-64"
              />
              <Select
                value={warehouseFilter}
                onChange={(v) => { setWarehouseFilter(v); setPage(1); }}
                options={[{ value: 'all', label: 'Tất cả kho' }, ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))]}
              />
              <Select
                value={status}
                onChange={(v) => { setStatus(v); setPage(1); }}
                options={[
                  { value: 'all', label: 'Tất cả trạng thái' },
                  { value: 'ok', label: 'Bình thường' },
                  { value: 'low', label: 'Sắp hết' },
                  { value: 'out', label: 'Thiếu hàng' },
                ]}
              />
              <span className="text-sm text-gray-400 ml-auto">{filtered.length} kết quả</span>
            </div>

            {paged.length === 0 ? (
              <EmptyState
                description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                action={{ label: 'Xóa bộ lọc', onClick: () => { setSearch(''); setWarehouseFilter('all'); setStatus('all'); } }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <Th>Mã vật tư</Th>
                        <Th>Tên vật tư</Th>
                        <Th>Kho</Th>
                        <Th>Vị trí</Th>
                        <Th className="text-right">Tồn kho</Th>
                        <Th className="text-right">Khả dụng</Th>
                        <Th>Trạng thái</Th>
                        <Th></Th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((row) => {
                        const st = stockStatus(row);
                        return (
                          <tr
                            key={row.inventory_id}
                            className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${selected?.inventory_id === row.inventory_id ? 'bg-indigo-50/60' : ''}`}
                            onClick={() => setSelected(selected?.inventory_id === row.inventory_id ? null : row)}
                          >
                            <Td><span className="font-mono text-xs text-gray-500">{row.item.item_code}</span></Td>
                            <Td><span className="font-medium text-gray-900">{row.item.item_name}</span></Td>
                            <Td>{row.warehouse.warehouse_name}</Td>
                            <Td><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{row.location.location_code}</code></Td>
                            <Td className="text-right font-semibold text-gray-900">{row.quantity.toLocaleString('vi-VN')}</Td>
                            <Td className="text-right">
                              <span className={st !== 'ok' ? 'text-danger font-semibold' : 'text-gray-700'}>
                                {row.available_quantity.toLocaleString('vi-VN')}
                              </span>
                            </Td>
                            <Td>
                              <Badge color={statusConfig[st].color}>{statusConfig[st].label}</Badge>
                            </Td>
                            <Td>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
              </>
            )}
          </Card>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-64 flex-shrink-0">
            <Card className="p-5 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-from)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4m0-14v14m8-14v10l-8 4" />
                  </svg>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h3 className="font-bold text-gray-900 text-sm mb-1">{selected.item.item_name}</h3>
              <span className="font-mono text-xs text-gray-400">{selected.item.item_code}</span>
              <div className="mt-3">
                <Badge color={statusConfig[stockStatus(selected)].color}>{statusConfig[stockStatus(selected)].label}</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { label: 'Kho lưu', value: selected.warehouse.warehouse_name },
                  { label: 'Vị trí', value: selected.location.location_code },
                  { label: 'Đơn vị', value: selected.item.unit },
                  { label: 'Tồn kho', value: `${selected.quantity} (khả dụng: ${selected.available_quantity})` },
                  { label: 'Đặt trước', value: `${selected.reserved_quantity} ${selected.item.unit}` },
                  { label: 'Ngưỡng min/max', value: `${selected.item.min_stock} / ${selected.item.max_stock ?? '—'}` },
                  { label: 'Cập nhật lần cuối', value: new Date(selected.updated_at).toLocaleString('vi-VN') },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">{item.label}</span>
                    <p className="text-sm text-gray-700 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {selected.item.max_stock != null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Mức tồn kho</span>
                    <span>{Math.round((selected.quantity / selected.item.max_stock) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (selected.quantity / selected.item.max_stock) * 100)}%`,
                        background: stockStatus(selected) === 'out' ? 'var(--color-danger)' : stockStatus(selected) === 'low' ? 'var(--color-warning)' : 'var(--color-brand-from)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Min: {selected.item.min_stock}</span>
                    <span>Max: {selected.item.max_stock}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Btn size="sm" onClick={() => onNavigate('import')}>Nhập thêm</Btn>
                <Btn size="sm" variant="secondary" onClick={() => onNavigate('history')}>Lịch sử</Btn>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
