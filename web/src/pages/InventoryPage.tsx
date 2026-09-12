import { useState } from 'react';
import type { Page } from '../types';
import PageLayout, { Card, Badge, Btn, Input, Select, Th, Td } from '../components/PageLayout';
import { Pagination, EmptyState } from '../components/ui';

const data = [
  { id: 'VT-001', name: 'IC555 Timer', category: 'Vi mạch tích hợp', warehouse: 'Kho A', location: 'A1-01-K3', qty: 250, available: 210, reserved: 40, min: 50, max: 500, unit: 'Cái', supplier: 'Bách Khoa Electronics', lastImport: '05/09/2025', status: 'ok' },
  { id: 'VT-002', name: 'Tụ 100μF 16V', category: 'Linh kiện thụ động', warehouse: 'Kho A', location: 'A2-03-K1', qty: 45, available: 45, reserved: 0, min: 50, max: 1000, unit: 'Cái', supplier: 'Saigon Components', lastImport: '28/08/2025', status: 'low' },
  { id: 'VT-003', name: 'Arduino Uno R3', category: 'Module & Dev Board', warehouse: 'Kho B', location: 'B1-02-K2', qty: 12, available: 10, reserved: 2, min: 5, max: 50, unit: 'Bộ', supplier: 'Arduino Vietnam', lastImport: '01/09/2025', status: 'ok' },
  { id: 'VT-004', name: 'Relay 5V 10A', category: 'Module công suất', warehouse: 'Kho A', location: 'A3-01-K4', qty: 3, available: 3, reserved: 0, min: 10, max: 100, unit: 'Cái', supplier: 'Saigon Components', lastImport: '20/08/2025', status: 'out' },
  { id: 'VT-005', name: 'ESP32 WiFi+BT', category: 'Module & Dev Board', warehouse: 'Kho B', location: 'B2-01-K1', qty: 85, available: 75, reserved: 10, min: 20, max: 200, unit: 'Cái', supplier: 'TI / Mouser VN', lastImport: '03/09/2025', status: 'ok' },
  { id: 'VT-006', name: 'Điện trở 10kΩ', category: 'Linh kiện thụ động', warehouse: 'Kho A', location: 'A1-02-K1', qty: 1200, available: 1200, reserved: 0, min: 200, max: 5000, unit: 'Cái', supplier: 'Bách Khoa Electronics', lastImport: '15/08/2025', status: 'ok' },
  { id: 'VT-007', name: 'Module L298N', category: 'Module công suất', warehouse: 'Kho B', location: 'B3-01-K2', qty: 2, available: 2, reserved: 0, min: 5, max: 30, unit: 'Cái', supplier: 'Saigon Components', lastImport: '10/07/2025', status: 'out' },
  { id: 'VT-008', name: 'Cảm biến DHT22', category: 'Cảm biến', warehouse: 'Kho A', location: 'A4-02-K3', qty: 28, available: 25, reserved: 3, min: 10, max: 100, unit: 'Cái', supplier: 'TI / Mouser VN', lastImport: '02/09/2025', status: 'low' },
  { id: 'VT-009', name: 'LED 5mm Đỏ', category: 'Linh kiện thụ động', warehouse: 'Kho A', location: 'A1-03-K2', qty: 430, available: 430, reserved: 0, min: 100, max: 2000, unit: 'Cái', supplier: 'Bách Khoa Electronics', lastImport: '25/08/2025', status: 'ok' },
  { id: 'VT-010', name: 'Transistor BC547', category: 'Vi mạch tích hợp', warehouse: 'Kho A', location: 'A2-01-K3', qty: 180, available: 160, reserved: 20, min: 50, max: 500, unit: 'Cái', supplier: 'Bách Khoa Electronics', lastImport: '22/08/2025', status: 'ok' },
];

const statusConfig = {
  ok: { label: 'Bình thường', color: 'green' as const },
  low: { label: 'Sắp hết', color: 'yellow' as const },
  out: { label: 'Thiếu hàng', color: 'red' as const },
};

const PAGE_SIZE = 7;

interface Props {
  onNavigate: (page: Page) => void;
}

export default function InventoryPage({ onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [warehouse, setWarehouse] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<typeof data[0] | null>(null);

  const filtered = data.filter((row) => {
    const matchSearch = search === '' || row.name.toLowerCase().includes(search.toLowerCase()) || row.id.toLowerCase().includes(search.toLowerCase());
    const matchWh = warehouse === 'all' || row.warehouse === warehouse;
    const matchSt = status === 'all' || row.status === status;
    return matchSearch && matchWh && matchSt;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <PageLayout
      title="Tồn kho"
      subtitle="Theo dõi số lượng và trạng thái tồn kho theo thời gian thực"
      actions={
        <>
          <Btn variant="secondary" size="sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Xuất Excel
          </Btn>
          <Btn onClick={() => onNavigate('import')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            Tạo phiếu nhập
          </Btn>
        </>
      }
    >
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Tổng mặt hàng', value: data.length, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', action: () => setStatus('all') },
          { label: 'Sắp hết hàng', value: data.filter(d => d.status === 'low').length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', action: () => setStatus('low') },
          { label: 'Thiếu hàng', value: data.filter(d => d.status === 'out').length, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', action: () => setStatus('out') },
        ].map((c) => (
          <button
            key={c.label}
            onClick={c.action}
            className={`${c.bg} border ${c.border} rounded-xl px-5 py-4 flex items-center justify-between hover:shadow-sm transition-all text-left`}
          >
            <span className="text-sm text-gray-600 font-medium">{c.label}</span>
            <span className={`text-2xl font-bold ${c.color}`}>{c.value}</span>
          </button>
        ))}
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
                value={warehouse}
                onChange={(v) => { setWarehouse(v); setPage(1); }}
                options={[
                  { value: 'all', label: 'Tất cả kho' },
                  { value: 'Kho A', label: 'Kho A' },
                  { value: 'Kho B', label: 'Kho B' },
                ]}
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

            {/* Table */}
            {paged.length === 0 ? (
              <EmptyState
                description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                action={{ label: 'Xóa bộ lọc', onClick: () => { setSearch(''); setWarehouse('all'); setStatus('all'); } }}
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
                      {paged.map((row) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${selected?.id === row.id ? 'bg-indigo-50/60' : ''}`}
                          onClick={() => setSelected(selected?.id === row.id ? null : row)}
                        >
                          <Td><span className="font-mono text-xs text-gray-500">{row.id}</span></Td>
                          <Td><span className="font-medium text-gray-900">{row.name}</span></Td>
                          <Td>{row.warehouse}</Td>
                          <Td><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{row.location}</code></Td>
                          <Td className="text-right font-semibold text-gray-900">{row.qty.toLocaleString()}</Td>
                          <Td className="text-right">
                            <span className={row.available < row.min ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                              {row.available.toLocaleString()}
                            </span>
                          </Td>
                          <Td>
                            <Badge color={statusConfig[row.status as keyof typeof statusConfig].color}>
                              {statusConfig[row.status as keyof typeof statusConfig].label}
                            </Badge>
                          </Td>
                          <Td>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </Td>
                        </tr>
                      ))}
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

              <h3 className="font-bold text-gray-900 text-sm mb-1">{selected.name}</h3>
              <span className="font-mono text-xs text-gray-400">{selected.id}</span>
              <div className="mt-3">
                <Badge color={statusConfig[selected.status as keyof typeof statusConfig].color}>
                  {statusConfig[selected.status as keyof typeof statusConfig].label}
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { label: 'Danh mục', value: selected.category },
                  { label: 'Kho lưu', value: selected.warehouse },
                  { label: 'Vị trí', value: selected.location },
                  { label: 'Đơn vị', value: selected.unit },
                  { label: 'Tồn kho', value: `${selected.qty} (khả dụng: ${selected.available})` },
                  { label: 'Đặt trước', value: `${selected.reserved} ${selected.unit}` },
                  { label: 'Ngưỡng min/max', value: `${selected.min} / ${selected.max}` },
                  { label: 'Nhà cung cấp', value: selected.supplier },
                  { label: 'Nhập kho lần cuối', value: selected.lastImport },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">{item.label}</span>
                    <p className="text-sm text-gray-700 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Stock bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Mức tồn kho</span>
                  <span>{Math.round((selected.qty / selected.max) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (selected.qty / selected.max) * 100)}%`,
                      background: selected.status === 'out' ? 'var(--color-danger)' : selected.status === 'low' ? 'var(--color-warning)' : 'var(--color-brand-from)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Min: {selected.min}</span>
                  <span>Max: {selected.max}</span>
                </div>
              </div>

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
