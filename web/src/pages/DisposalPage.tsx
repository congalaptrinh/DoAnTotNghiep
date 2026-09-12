import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Th, Td } from '../components/PageLayout';

const receipts = [
  { id: 'TL-2025-0012', date: '03/09/2025', reason: 'Linh kiện hỏng, không sửa được', creator: 'Nguyễn Văn An', items: 3, value: 1250000, status: 'approved' },
  { id: 'TL-2025-0011', date: '28/08/2025', reason: 'Vật tư hết hạn sử dụng', creator: 'Phạm Thanh Tú', items: 5, value: 3400000, status: 'pending' },
  { id: 'TL-2025-0010', date: '20/08/2025', reason: 'Thanh lý tài sản cũ theo quyết định ban lãnh đạo', creator: 'Lê Minh Đức', items: 8, value: 12500000, status: 'done' },
];

const statusConfig = {
  pending: { label: 'Chờ duyệt', color: 'yellow' as const },
  approved: { label: 'Đã duyệt', color: 'indigo' as const },
  done: { label: 'Hoàn tất', color: 'green' as const },
};

export default function DisposalPage() {
  const [view, setView] = useState<'list' | 'create'>('list');

  if (view === 'create') {
    return (
      <PageLayout
        title="Tạo phiếu thanh lý"
        subtitle="Thanh lý vật tư hư hỏng hoặc không còn sử dụng"
        actions={<Btn variant="secondary" onClick={() => setView('list')}>← Quay lại</Btn>}
      >
        <div className="max-w-2xl">
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-amber-700">
              Phiếu thanh lý yêu cầu phê duyệt từ Quản lý kho hoặc Ban lãnh đạo trước khi thực hiện.
              Vui lòng điền đầy đủ thông tin và lý do rõ ràng.
            </p>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              {[
                { label: 'Lý do thanh lý', placeholder: 'Mô tả rõ lý do thanh lý...' },
                { label: 'Hình thức xử lý', placeholder: 'VD: Hủy bỏ / Bán thanh lý / Trả nhà cung cấp' },
                { label: 'Giá trị ước tính (VNĐ)', placeholder: '0', type: 'number' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              ))}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Vật tư thanh lý</label>
                  <Btn variant="secondary" size="sm">+ Thêm vật tư</Btn>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Relay 5V 10A (hư cháy)', code: 'SP-0004', qty: 3, unit: 'Cái', value: '45.000đ/cái' },
                    { name: 'Module L298N (hỏng chân)', code: 'SP-0007', qty: 5, unit: 'Cái', value: '120.000đ/cái' },
                  ].map((item) => (
                    <div key={item.code} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.code} • Giá trị còn lại: {item.value}</p>
                      </div>
                      <input type="number" defaultValue={item.qty} className="w-16 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:outline-none" />
                      <span className="text-xs text-gray-500 w-6">{item.unit}</span>
                      <button className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Btn variant="ghost">Lưu nháp</Btn>
                <Btn variant="secondary">Gửi phê duyệt</Btn>
              </div>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Thanh lý"
      subtitle="Quản lý phiếu thanh lý vật tư hư hỏng hoặc không còn sử dụng"
      actions={
        <Btn onClick={() => setView('create')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          Tạo phiếu thanh lý
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
                <Th>Lý do thanh lý</Th>
                <Th>Người tạo</Th>
                <Th className="text-right">Mặt hàng</Th>
                <Th className="text-right">Giá trị (VNĐ)</Th>
                <Th>Trạng thái</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                  <Td><span className="font-mono text-sm font-semibold text-gray-500">{r.id}</span></Td>
                  <Td><span className="text-sm text-gray-500">{r.date}</span></Td>
                  <Td><span className="text-gray-700">{r.reason}</span></Td>
                  <Td>{r.creator}</Td>
                  <Td className="text-right">{r.items}</Td>
                  <Td className="text-right font-semibold text-gray-900">{r.value.toLocaleString('vi-VN')}</Td>
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
