import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Th, Td } from '../components/PageLayout';

const sessions = [
  { id: 'KK-2025-0025', date: '05/09/2025', warehouse: 'Kho A', creator: 'Phạm Thanh Tú', items: 42, matched: 40, diff: 2, status: 'active' },
  { id: 'KK-2025-0024', date: '01/09/2025', warehouse: 'Kho B', creator: 'Trần Thị Bình', items: 35, matched: 35, diff: 0, status: 'done' },
  { id: 'KK-2025-0023', date: '25/08/2025', warehouse: 'Kho A', creator: 'Nguyễn Văn An', items: 50, matched: 47, diff: 3, status: 'done' },
];

const stocktakeItems = [
  { id: 'SP-0001', name: 'IC555 Timer', location: 'A1-01-K3', system: 250, actual: 252, unit: 'Cái' },
  { id: 'SP-0002', name: 'Tụ 100μF 16V', location: 'A2-03-K1', system: 45, actual: 43, unit: 'Cái' },
  { id: 'SP-0003', name: 'Arduino Uno R3', location: 'A4-01-K2', system: 12, actual: 12, unit: 'Bộ' },
  { id: 'SP-0004', name: 'Relay 5V 10A', location: 'A3-01-K4', system: 3, actual: 5, unit: 'Cái' },
  { id: 'SP-0006', name: 'Điện trở 10kΩ', location: 'A1-02-K1', system: 1200, actual: 1185, unit: 'Cái' },
  { id: 'SP-0008', name: 'Cảm biến DHT22', location: 'A4-02-K3', system: 28, actual: 28, unit: 'Cái' },
];

const statusConfig = {
  active: { label: 'Đang tiến hành', color: 'indigo' as const },
  done: { label: 'Hoàn tất', color: 'green' as const },
};

export default function StocktakePage() {
  const [view, setView] = useState<'list' | 'count'>('list');
  const [actuals, setActuals] = useState<number[]>(stocktakeItems.map((i) => i.actual));

  if (view === 'count') {
    return (
      <PageLayout
        title="Kiểm kê #KK-2025-0025 — Kho A"
        subtitle="Đối chiếu số liệu hệ thống và thực tế"
        actions={<Btn variant="secondary" onClick={() => setView('list')}>← Quay lại</Btn>}
      >
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge color="indigo">Đang tiến hành</Badge>
              <span className="text-sm text-gray-500">Người kiểm: Phạm Thanh Tú • 05/09/2025</span>
            </div>
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm">Lưu tiến độ</Btn>
              <Btn size="sm">Hoàn tất kiểm kê</Btn>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Mã SP</Th>
                  <Th>Tên vật tư</Th>
                  <Th>Vị trí</Th>
                  <Th className="text-right">Hệ thống</Th>
                  <Th className="text-right">Thực tế</Th>
                  <Th className="text-right">Chênh lệch</Th>
                  <Th>Ghi chú</Th>
                </tr>
              </thead>
              <tbody>
                {stocktakeItems.map((item, i) => {
                  const diff = actuals[i] - item.system;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <Td><span className="font-mono text-xs text-gray-500">{item.id}</span></Td>
                      <Td><span className="font-medium text-gray-900">{item.name}</span></Td>
                      <Td><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{item.location}</code></Td>
                      <Td className="text-right text-gray-700">{item.system}</Td>
                      <Td className="text-right">
                        <input
                          type="number"
                          value={actuals[i]}
                          onChange={(e) => {
                            const n = [...actuals];
                            n[i] = parseInt(e.target.value) || 0;
                            setActuals(n);
                          }}
                          className="w-20 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </Td>
                      <Td className="text-right">
                        <span className={`font-bold text-sm ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      </Td>
                      <Td>
                        <input type="text" placeholder="Ghi chú..." className="w-32 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none" />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100">
            <div className="flex gap-6 text-sm">
              <span className="text-gray-500">Tổng mặt hàng: <b className="text-gray-900">{stocktakeItems.length}</b></span>
              <span className="text-green-600">Dư: <b>{actuals.reduce((s, a, i) => s + Math.max(0, a - stocktakeItems[i].system), 0)}</b></span>
              <span className="text-red-600">Thiếu: <b>{actuals.reduce((s, a, i) => s + Math.max(0, stocktakeItems[i].system - a), 0)}</b></span>
              <span className="text-gray-500">Khớp: <b className="text-gray-900">{actuals.filter((a, i) => a === stocktakeItems[i].system).length}</b></span>
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
        <Btn>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          Tạo phiên kiểm kê
        </Btn>
      }
    >
      <Card>
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
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                  <Td><span className="font-mono text-sm font-semibold text-yellow-600">{s.id}</span></Td>
                  <Td><span className="text-sm text-gray-500">{s.date}</span></Td>
                  <Td><span className="font-medium text-gray-700">{s.warehouse}</span></Td>
                  <Td>{s.creator}</Td>
                  <Td className="text-right">{s.items}</Td>
                  <Td className="text-right text-green-600 font-semibold">{s.matched}</Td>
                  <Td className="text-right">
                    <span className={`font-semibold ${s.diff > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {s.diff > 0 ? `+${s.diff}` : '0'}
                    </span>
                  </Td>
                  <Td>
                    <Badge color={statusConfig[s.status as keyof typeof statusConfig].color}>
                      {statusConfig[s.status as keyof typeof statusConfig].label}
                    </Badge>
                  </Td>
                  <Td>
                    <Btn variant="ghost" size="sm" onClick={() => setView('count')}>
                      {s.status === 'active' ? 'Tiếp tục' : 'Xem'}
                    </Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageLayout>
  );
}
