import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Th, Td } from '../components/PageLayout';
import { Modal } from '../components/ui';

const receipts = [
  { id: 'XK-2025-0445', date: '05/09/2025 08:30', recipient: 'Lab IoT - Khoa CNTT', purpose: 'Bài thực hành IoT tháng 9', creator: 'Lê Thị Hoa', items: 2, qty: 22, status: 'approved' },
  { id: 'XK-2025-0444', date: '04/09/2025 15:00', recipient: 'Phòng R&D', purpose: 'Nghiên cứu hệ thống nhúng Q3', creator: 'Nguyễn Văn An', items: 4, qty: 45, status: 'pending' },
  { id: 'XK-2025-0443', date: '03/09/2025 10:15', recipient: 'Workshop Tháng 9', purpose: 'Workshop IoT cho sinh viên', creator: 'Phạm Thanh Tú', items: 6, qty: 120, status: 'approved' },
  { id: 'XK-2025-0442', date: '02/09/2025 13:45', recipient: 'Dự án Smart Home', purpose: 'Prototype Smart Home v2', creator: 'Trần Văn Bình', items: 3, qty: 30, status: 'rejected' },
  { id: 'XK-2025-0441', date: '01/09/2025 09:00', recipient: 'Lab Điện tử cơ bản', purpose: 'Giảng dạy học kỳ 1 2025', creator: 'Lê Minh Đức', items: 8, qty: 200, status: 'approved' },
];

const statusConfig = {
  draft: { label: 'Nháp', color: 'gray' as const },
  pending: { label: 'Chờ duyệt', color: 'yellow' as const },
  approved: { label: 'Đã duyệt', color: 'green' as const },
  rejected: { label: 'Từ chối', color: 'red' as const },
};

const formItems = [
  { name: 'Arduino Uno R3', code: 'SP-0003', unit: 'Bộ', stock: 10, requested: 15, ok: false },
  { name: 'Cảm biến DHT22', code: 'SP-0008', unit: 'Cái', stock: 25, requested: 10, ok: true },
  { name: 'ESP32 WiFi+BT', code: 'SP-0005', unit: 'Cái', stock: 75, requested: 5, ok: true },
];

export default function ExportPage() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = receipts.find((r) => r.id === detailId);

  if (view === 'create') {
    return (
      <PageLayout
        title="Tạo phiếu xuất kho"
        subtitle="Xuất kho theo yêu cầu sử dụng"
        actions={<Btn variant="secondary" onClick={() => setView('list')}>← Quay lại</Btn>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info */}
          <Card className="p-5 lg:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">Thông tin phiếu xuất</h3>
            <div className="space-y-4">
              {[
                { label: 'Người/bộ phận nhận', placeholder: 'VD: Lab IoT - Khoa CNTT' },
                { label: 'Mục đích sử dụng', placeholder: 'VD: Bài thực hành IoT tháng 9' },
                { label: 'Kho xuất', placeholder: 'Kho A - Chính' },
                { label: 'Ngày xuất dự kiến', placeholder: 'dd/mm/yyyy', type: 'date' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Items */}
          <Card className="lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Danh sách vật tư xuất</h3>
              <Btn variant="secondary" size="sm">+ Thêm vật tư</Btn>
            </div>

            {/* Warning banner */}
            <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-700">Cảnh báo: Tồn kho không đủ</p>
                <p className="text-xs text-red-600 mt-0.5">
                  <b>Arduino Uno R3</b>: Yêu cầu 15 bộ nhưng chỉ còn 10 bộ khả dụng.
                  Vui lòng điều chỉnh số lượng hoặc liên hệ đặt thêm hàng.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Vật tư</Th>
                    <Th className="text-right">Tồn kho</Th>
                    <Th className="text-right">Số lượng yêu cầu</Th>
                    <Th>Kiểm tra</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {formItems.map((item) => (
                    <tr key={item.code} className="hover:bg-gray-50/60 transition-colors">
                      <Td>
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-400">{item.code} • {item.unit}</div>
                        </div>
                      </Td>
                      <Td className="text-right">
                        <span className={item.stock < item.requested ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                          {item.stock}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <input
                          type="number"
                          defaultValue={item.requested}
                          className={`w-20 px-2 py-1 text-sm text-right border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                            !item.ok ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                        />
                      </Td>
                      <Td>
                        {item.ok ? (
                          <Badge color="green">Đủ hàng</Badge>
                        ) : (
                          <Badge color="red">Không đủ</Badge>
                        )}
                      </Td>
                      <Td>
                        <button className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <Btn variant="ghost">Lưu nháp</Btn>
              <Btn variant="secondary">Gửi duyệt</Btn>
              <Btn>Xuất kho ngay</Btn>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Xuất kho"
      subtitle="Quản lý phiếu xuất kho theo yêu cầu sử dụng"
      actions={
        <Btn onClick={() => setView('create')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          Tạo phiếu xuất
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
                <Th>Người/bộ phận nhận</Th>
                <Th>Mục đích</Th>
                <Th>Người tạo</Th>
                <Th className="text-right">Tổng SL</Th>
                <Th>Trạng thái</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetailId(r.id)}>
                  <Td><span className="font-mono text-sm font-semibold text-violet-600">{r.id}</span></Td>
                  <Td><span className="text-sm text-gray-500">{r.date}</span></Td>
                  <Td><span className="font-medium text-gray-900">{r.recipient}</span></Td>
                  <Td><span className="text-gray-500 text-sm truncate max-w-[160px] block">{r.purpose}</span></Td>
                  <Td>{r.creator}</Td>
                  <Td className="text-right font-semibold text-gray-900">{r.qty}</Td>
                  <Td>
                    <Badge color={statusConfig[r.status as keyof typeof statusConfig].color}>
                      {statusConfig[r.status as keyof typeof statusConfig].label}
                    </Badge>
                  </Td>
                  <Td>
                    <Btn variant="ghost" size="sm" onClick={(e) => { e?.stopPropagation(); setDetailId(r.id); }}>Xem</Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!detail} onClose={() => setDetailId(null)} title="Chi tiết phiếu xuất kho" size="lg">
        {detail && (
          <>
            <p className="font-mono text-sm text-violet-600 -mt-3 mb-4">{detail.id}</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Người nhận', value: detail.recipient },
                { label: 'Mục đích', value: detail.purpose },
                { label: 'Người tạo', value: detail.creator },
                { label: 'Ngày tạo', value: detail.date },
                { label: 'Số mặt hàng', value: `${detail.items} loại` },
                { label: 'Tổng số lượng', value: `${detail.qty} đơn vị` },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <Badge color={statusConfig[detail.status as keyof typeof statusConfig].color}>
                {statusConfig[detail.status as keyof typeof statusConfig].label}
              </Badge>
              <div className="flex gap-2">
                {detail.status === 'pending' && (
                  <>
                    <Btn size="sm">Phê duyệt</Btn>
                    <Btn size="sm" variant="danger">Từ chối</Btn>
                  </>
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
