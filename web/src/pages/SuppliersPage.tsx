import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Input, Th, Td } from '../components/PageLayout';

const suppliers = [
  { id: 'NCC-001', name: 'Công ty TNHH Điện tử Bách Khoa', short: 'Bách Khoa Electronics', contact: 'Nguyễn Hữu Phước', phone: '028 3810 5678', email: 'sales@bachkhoa-elec.vn', address: '268 Lý Thường Kiệt, P.14, Q.10, TP.HCM', category: 'IC & Vi mạch', rating: 5, status: 'active', orders: 48 },
  { id: 'NCC-002', name: 'Công ty CP Linh kiện Sài Gòn', short: 'Saigon Components', contact: 'Trần Thị Lan', phone: '028 6252 7890', email: 'order@saigon-components.com', address: '45 Nguyễn Thị Minh Khai, P.2, Q.3, TP.HCM', category: 'Linh kiện thụ động', rating: 4, status: 'active', orders: 35 },
  { id: 'NCC-003', name: 'Đại lý TI Vietnam - Mouser VN', short: 'TI / Mouser VN', contact: 'Lê Văn Cường', phone: '024 3795 4321', email: 'vn.sales@mouser.com', address: '82 Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội', category: 'IC cao cấp & Module', rating: 5, status: 'active', orders: 22 },
  { id: 'NCC-004', name: 'Cty TNHH Phân phối Arduino VN', short: 'Arduino Vietnam', contact: 'Phạm Quốc Bảo', phone: '028 3933 1122', email: 'bao@arduino.vn', address: '15 Đinh Tiên Hoàng, P.1, Q.Bình Thạnh, TP.HCM', category: 'Dev Board & Module', rating: 4, status: 'active', orders: 19 },
  { id: 'NCC-005', name: 'Công ty TNHH Kỹ Thuật Số Việt', short: 'Kỹ Thuật Số Việt', contact: 'Vũ Thị Ngọc', phone: '028 6256 3344', email: 'info@kythuatsoviet.com', address: '101 Võ Văn Tần, P.6, Q.3, TP.HCM', category: 'Thiết bị đo & kiểm tra', rating: 3, status: 'inactive', orders: 8 },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= n ? '#F59E0B' : 'none'} stroke={i <= n ? '#F59E0B' : '#D1D5DB'} strokeWidth={2}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = suppliers.filter((s) =>
    search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase())
  );

  const detail = suppliers.find((s) => s.id === selected);

  return (
    <PageLayout
      title="Nhà cung cấp"
      subtitle="Quản lý danh sách nhà cung cấp linh kiện và thiết bị"
      actions={
        <Btn>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          Thêm nhà cung cấp
        </Btn>
      }
    >
      <div className="flex gap-5">
        {/* List */}
        <div className="flex-1">
          <Card>
            <div className="px-5 py-4 border-b border-gray-100">
              <Input
                placeholder="Tìm nhà cung cấp hoặc người liên hệ..."
                value={search}
                onChange={setSearch}
                className="w-full"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Nhà cung cấp</Th>
                    <Th>Người liên hệ</Th>
                    <Th>Nhóm hàng</Th>
                    <Th className="text-right">Đơn hàng</Th>
                    <Th>Đánh giá</Th>
                    <Th>Trạng thái</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${selected === s.id ? 'bg-indigo-50/60' : ''}`}
                      onClick={() => setSelected(s.id === selected ? null : s.id)}
                    >
                      <Td>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{s.short}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{s.id}</div>
                        </div>
                      </Td>
                      <Td>
                        <div>
                          <div className="text-sm text-gray-700">{s.contact}</div>
                          <div className="text-xs text-gray-400">{s.phone}</div>
                        </div>
                      </Td>
                      <Td><span className="text-sm text-gray-500">{s.category}</span></Td>
                      <Td className="text-right font-semibold text-gray-900">{s.orders}</Td>
                      <Td><Stars n={s.rating} /></Td>
                      <Td>
                        <Badge color={s.status === 'active' ? 'green' : 'gray'}>
                          {s.status === 'active' ? 'Hoạt động' : 'Ngưng hợp tác'}
                        </Badge>
                      </Td>
                      <Td>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        {detail && (
          <div className="w-72 flex-shrink-0">
            <Card className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H3m2 0h14M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-0.5">{detail.name}</h3>
              <p className="text-xs text-gray-400 mb-4">{detail.id}</p>
              <Stars n={detail.rating} />

              <div className="mt-4 space-y-3">
                {[
                  { label: 'Liên hệ', value: detail.contact },
                  { label: 'Điện thoại', value: detail.phone },
                  { label: 'Email', value: detail.email },
                  { label: 'Địa chỉ', value: detail.address },
                  { label: 'Nhóm hàng', value: detail.category },
                  { label: 'Số đơn hàng', value: `${detail.orders} đơn` },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">{item.label}</span>
                    <p className="text-sm text-gray-700 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <Btn variant="primary" size="sm">Tạo đơn mua</Btn>
                <Btn variant="secondary" size="sm">Lịch sử</Btn>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
