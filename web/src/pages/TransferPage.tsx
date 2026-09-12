import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Th, Td } from '../components/PageLayout';

const receipts = [
  { id: 'CK-2025-0112', date: '04/09/2025 16:30', from: 'Kho A', to: 'Kho B', creator: 'Nguyễn Văn An', items: 2, qty: 35, status: 'done' },
  { id: 'CK-2025-0111', date: '03/09/2025 14:00', from: 'Kho B', to: 'Kho C', creator: 'Trần Thị Bình', items: 3, qty: 60, status: 'approved' },
  { id: 'CK-2025-0110', date: '02/09/2025 09:30', from: 'Kho A', to: 'Kho B', creator: 'Lê Minh Đức', items: 1, qty: 20, status: 'pending' },
  { id: 'CK-2025-0109', date: '01/09/2025 11:15', from: 'Kho C', to: 'Kho A', creator: 'Phạm Thanh Tú', items: 4, qty: 80, status: 'done' },
];

const statusConfig = {
  pending: { label: 'Chờ duyệt', color: 'yellow' as const },
  approved: { label: 'Đã duyệt', color: 'indigo' as const },
  done: { label: 'Hoàn tất', color: 'green' as const },
};

export default function TransferPage() {
  const [view, setView] = useState<'list' | 'create'>('list');

  if (view === 'create') {
    return (
      <PageLayout
        title="Tạo phiếu chuyển kho"
        subtitle="Di chuyển vật tư giữa các kho"
        actions={<Btn variant="secondary" onClick={() => setView('list')}>← Quay lại</Btn>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Source */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 text-xs font-bold">T</span>
              </div>
              <h3 className="font-semibold text-gray-900">Kho nguồn</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kho xuất</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option>Kho A - Chính</option>
                  <option>Kho B - Chính</option>
                  <option>Kho C - Phụ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vị trí nguồn</label>
                <input type="text" placeholder="VD: A1-01-K3" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>

              <div className="mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Vật tư chuyển</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Relay 5V 10A', qty: 30, unit: 'Cái' },
                    { name: 'ESP32 WiFi+BT', qty: 20, unit: 'Cái' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                      <input type="number" defaultValue={item.qty} className="w-16 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:outline-none" />
                      <span className="text-xs text-gray-400">{item.unit}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-2 w-full text-xs text-indigo-600 py-2 border border-dashed border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors font-medium">
                  + Thêm vật tư
                </button>
              </div>
            </div>
          </Card>

          {/* Arrow */}
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

          {/* Destination */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">Đ</span>
              </div>
              <h3 className="font-semibold text-gray-900">Kho đích</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kho nhận</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option>Kho B - Chính</option>
                  <option>Kho A - Chính</option>
                  <option>Kho C - Phụ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vị trí đích</label>
                <input type="text" placeholder="VD: B3-02-K1" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do chuyển kho</label>
                <textarea
                  rows={4}
                  placeholder="Ghi rõ lý do chuyển kho..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="ghost">Lưu nháp</Btn>
          <Btn variant="secondary">Gửi duyệt</Btn>
          <Btn>Xác nhận chuyển kho</Btn>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Chuyển kho"
      subtitle="Quản lý phiếu chuyển vật tư giữa các kho"
      actions={
        <Btn onClick={() => setView('create')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          Tạo phiếu chuyển
        </Btn>
      }
    >
      <Card>
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
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                  <Td><span className="font-mono text-sm font-semibold text-blue-600">{r.id}</span></Td>
                  <Td><span className="text-sm text-gray-500">{r.date}</span></Td>
                  <Td><Badge color="indigo">{r.from}</Badge></Td>
                  <Td>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Td>
                  <Td><Badge color="green">{r.to}</Badge></Td>
                  <Td>{r.creator}</Td>
                  <Td className="text-right font-semibold text-gray-900">{r.qty}</Td>
                  <Td>
                    <Badge color={statusConfig[r.status as keyof typeof statusConfig].color}>
                      {statusConfig[r.status as keyof typeof statusConfig].label}
                    </Badge>
                  </Td>
                  <Td><Btn variant="ghost" size="sm">Xem</Btn></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageLayout>
  );
}
