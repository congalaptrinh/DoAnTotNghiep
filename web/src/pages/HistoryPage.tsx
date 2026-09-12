import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Select, Input } from '../components/PageLayout';
import { Pagination } from '../components/ui';

type LogType = 'import' | 'export' | 'transfer' | 'recovery' | 'stocktake' | 'disposal';

const typeConfig: Record<LogType, { label: string; color: 'green' | 'red' | 'blue' | 'purple' | 'yellow' | 'gray'; bg: string; icon: string }> = {
  import: { label: 'Nhập kho', color: 'green', bg: 'bg-green-100 text-green-700', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  export: { label: 'Xuất kho', color: 'red', bg: 'bg-red-100 text-red-700', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  transfer: { label: 'Chuyển kho', color: 'blue', bg: 'bg-blue-100 text-blue-700', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  recovery: { label: 'Thu hồi', color: 'purple', bg: 'bg-purple-100 text-purple-700', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  stocktake: { label: 'Kiểm kê', color: 'yellow', bg: 'bg-yellow-100 text-yellow-700', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  disposal: { label: 'Thanh lý', color: 'gray', bg: 'bg-gray-100 text-gray-600', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
};

const logs = [
  { id: 'NK-2025-0891', time: '05/09/2025 09:42', type: 'import' as LogType, item: 'IC555 Timer', qty: 150, warehouse: 'Kho A', location: 'A1-01-K3', user: 'Trần Văn Bình', note: 'Nhập từ Bách Khoa Electronics — hóa đơn INV-BE-2025-0445' },
  { id: 'XK-2025-0445', time: '05/09/2025 08:30', type: 'export' as LogType, item: 'Arduino Uno R3', qty: -20, warehouse: 'Kho B', location: 'B1-02-K2', user: 'Lê Thị Hoa', note: 'Xuất cho Lab IoT - Khoa CNTT, bài thực hành tháng 9' },
  { id: 'CK-2025-0112', time: '04/09/2025 16:30', type: 'transfer' as LogType, item: 'Relay 5V 10A', qty: 30, warehouse: 'Kho A → Kho B', location: 'A3-01-K4 → B3-01-K2', user: 'Nguyễn Văn An', note: 'Cân bằng tồn kho — Kho A dư, Kho B thiếu' },
  { id: 'TH-2025-0044', time: '03/09/2025 14:30', type: 'recovery' as LogType, item: 'Cảm biến DHT22 (×8)', qty: 8, warehouse: 'Kho A', location: 'A4-02-K3', user: 'Lê Thị Hoa', note: 'Thu hồi từ Phòng thực hành sau dự án kết thúc' },
  { id: 'NK-2025-0889', time: '03/09/2025 11:30', type: 'import' as LogType, item: 'ESP32 WiFi+BT', qty: 50, warehouse: 'Kho B', location: 'B2-01-K1', user: 'Nguyễn Văn An', note: 'Nhập từ TI / Mouser VN — hóa đơn MV-VN-2025-0122' },
  { id: 'XK-2025-0444', time: '04/09/2025 15:00', type: 'export' as LogType, item: 'Nhiều loại (4 mặt hàng)', qty: -45, warehouse: 'Kho A', location: 'Nhiều vị trí', user: 'Trần Văn Bình', note: 'Xuất cho Phòng R&D theo phiếu PR-2025-0098' },
  { id: 'KK-2025-0023', time: '25/08/2025 10:00', type: 'stocktake' as LogType, item: 'Kho A — 50 mặt hàng', qty: 0, warehouse: 'Kho A', location: 'Toàn bộ khu A', user: 'Nguyễn Văn An', note: 'Kết quả: dư +2 ESP32 WiFi+BT, thiếu -5 Tụ 100μF 16V' },
  { id: 'TL-2025-0010', time: '20/08/2025 09:00', type: 'disposal' as LogType, item: 'Module L298N (hỏng)', qty: -8, warehouse: 'Kho B', location: 'B3-01-K2', user: 'Lê Minh Đức', note: 'Thanh lý 8 module L298N hư hỏng không sửa được, giá trị: 960.000đ' },
  { id: 'TH-2025-0043', time: '01/09/2025 10:00', type: 'recovery' as LogType, item: 'Arduino Uno R3 (×3)', qty: 3, warehouse: 'Kho B', location: 'B1-02-K2', user: 'Trần Văn Bình', note: 'Thu hồi từ Workshop Smart Home đã kết thúc' },
  { id: 'NK-2025-0888', time: '02/09/2025 16:00', type: 'import' as LogType, item: 'Nhiều loại (4 mặt hàng)', qty: 85, warehouse: 'Kho A', location: 'Nhiều vị trí', user: 'Phạm Thanh Tú', note: 'Nhập từ Arduino Vietnam — hóa đơn AV-2025-0088' },
];

const PAGE_SIZE = 8;

export default function HistoryPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<typeof logs[0] | null>(null);

  const filtered = logs.filter((l) => {
    const matchType = typeFilter === 'all' || l.type === typeFilter;
    const matchSearch = search === '' || l.item.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const paged = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  return (
    <PageLayout
      title="Lịch sử biến động kho"
      subtitle="Toàn bộ giao dịch nhập-xuất-chuyển kho theo thời gian"
      actions={
        <Btn variant="secondary" size="sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Xuất Excel
        </Btn>
      }
    >
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => { setTypeFilter('all'); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${typeFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
        >
          Tất cả ({logs.length})
        </button>
        {(Object.entries(typeConfig) as [LogType, typeof typeConfig[LogType]][]).map(([type, cfg]) => {
          const count = logs.filter((l) => l.type === type).length;
          return (
            <button
              key={type}
              onClick={() => { setTypeFilter(typeFilter === type ? 'all' : type); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                typeFilter === type
                  ? `${cfg.bg} border-current`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <Input
                placeholder="Tìm theo mã phiếu, vật tư, người thực hiện..."
                value={search}
                onChange={(v) => { setSearch(v); setPage(1); }}
                className="w-72"
              />
              <span className="text-sm text-gray-400 ml-auto">{filtered.length} bản ghi</span>
            </div>

            {paged.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-500 font-medium">Không có bản ghi phù hợp</p>
                <button onClick={() => { setTypeFilter('all'); setSearch(''); }} className="mt-2 text-sm text-indigo-600 hover:underline">
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {paged.map((log) => {
                    const cfg = typeConfig[log.type];
                    return (
                      <div
                        key={`${log.id}-${log.time}`}
                        onClick={() => setSelected(selected?.id === log.id ? null : log)}
                        className={`px-5 py-4 flex items-start gap-4 hover:bg-gray-50/60 transition-colors cursor-pointer ${selected?.id === log.id ? 'bg-indigo-50/40' : ''}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d={cfg.icon} />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge color={cfg.color}>{cfg.label}</Badge>
                            <span className="font-mono text-xs text-gray-500">{log.id}</span>
                            <span className="text-sm font-semibold text-gray-900 truncate">{log.item}</span>
                            {log.qty !== 0 && (
                              <span className={`text-sm font-bold ${log.qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {log.qty > 0 ? `+${log.qty}` : log.qty}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{log.note}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                            <span>{log.time}</span>
                            <span>•</span>
                            <span>{log.warehouse}</span>
                            <span>•</span>
                            <span>{log.user}</span>
                          </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    );
                  })}
                </div>

                <Pagination page={curPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
              </>
            )}
          </Card>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-64 flex-shrink-0">
            <Card className="p-5 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <Badge color={typeConfig[selected.type].color}>{typeConfig[selected.type].label}</Badge>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h3 className="font-bold text-gray-900 text-sm mb-0.5">{selected.item}</h3>
              <p className="font-mono text-xs text-gray-400 mb-4">{selected.id}</p>

              <div className="space-y-3">
                {[
                  { label: 'Thời gian', value: selected.time },
                  { label: 'Kho', value: selected.warehouse },
                  { label: 'Vị trí', value: selected.location },
                  { label: 'Người thực hiện', value: selected.user },
                  { label: 'Số lượng', value: selected.qty === 0 ? '—' : (selected.qty > 0 ? `+${selected.qty}` : `${selected.qty}`) },
                  { label: 'Ghi chú', value: selected.note },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">{item.label}</span>
                    <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Btn variant="secondary" size="sm">Xem phiếu gốc</Btn>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
