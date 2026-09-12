import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Th, Td } from '../components/PageLayout';

const receipts = [
  { id: 'TH-2025-0045', date: '04/09/2025 11:00', reason: 'Trả lại từ dự án hoàn thành', creator: 'Nguyễn Văn An', items: 3, qty: 15, status: 'completed' },
  { id: 'TH-2025-0044', date: '03/09/2025 14:30', reason: 'Vật tư không đúng yêu cầu kỹ thuật', creator: 'Lê Thị Hoa', items: 1, qty: 5, status: 'pending' },
  { id: 'TH-2025-0043', date: '01/09/2025 10:00', reason: 'Đặt hàng dư, trả về kho', creator: 'Trần Văn Bình', items: 4, qty: 40, status: 'completed' },
];

const statusConfig = {
  pending: { label: 'Chờ xử lý', color: 'yellow' as const },
  completed: { label: 'Hoàn tất', color: 'green' as const },
};

export default function RecoveryPage() {
  const [view, setView] = useState<'list' | 'create'>('list');

  if (view === 'create') {
    return (
      <PageLayout
        title="Tạo phiếu thu hồi"
        subtitle="Thu hồi vật tư từ bộ phận sử dụng về kho"
        actions={<Btn variant="secondary" onClick={() => setView('list')}>← Quay lại</Btn>}
      >
        <div className="max-w-2xl">
          <Card className="p-6">
            <div className="space-y-4">
              {[
                { label: 'Người/bộ phận trả hàng', placeholder: 'VD: Lab IoT - Khoa CNTT' },
                { label: 'Kho nhận lại', placeholder: 'Kho A - Chính' },
                { label: 'Lý do thu hồi', placeholder: 'Nhập lý do thu hồi vật tư...' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              ))}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Danh sách vật tư thu hồi</label>
                  <Btn variant="secondary" size="sm">+ Thêm vật tư</Btn>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Arduino Uno R3', code: 'SP-0003', qty: 3, unit: 'Bộ', condition: 'good' },
                    { name: 'Cảm biến DHT22', code: 'SP-0008', qty: 8, unit: 'Cái', condition: 'good' },
                    { name: 'Module L298N', code: 'SP-0007', qty: 2, unit: 'Cái', condition: 'damaged' },
                  ].map((item) => (
                    <div key={item.code} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{item.code}</span>
                      </div>
                      <input type="number" defaultValue={item.qty} className="w-16 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:outline-none" />
                      <span className="text-xs text-gray-500 w-8">{item.unit}</span>
                      <select defaultValue={item.condition} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                        <option value="good">Còn tốt</option>
                        <option value="worn">Đã mòn</option>
                        <option value="damaged">Hư hại</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Btn variant="ghost">Lưu nháp</Btn>
                <Btn>Xác nhận thu hồi</Btn>
              </div>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Thu hồi"
      subtitle="Quản lý phiếu thu hồi vật tư từ bộ phận sử dụng"
      actions={
        <Btn onClick={() => setView('create')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          Tạo phiếu thu hồi
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
                <Th>Lý do thu hồi</Th>
                <Th>Người tạo</Th>
                <Th className="text-right">Tổng SL</Th>
                <Th>Trạng thái</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                  <Td><span className="font-mono text-sm font-semibold text-purple-600">{r.id}</span></Td>
                  <Td><span className="text-sm text-gray-500">{r.date}</span></Td>
                  <Td><span className="text-gray-700">{r.reason}</span></Td>
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
