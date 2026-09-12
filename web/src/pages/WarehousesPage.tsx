import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Th, Td } from '../components/PageLayout';
import { Tabs } from '../components/ui';

const warehouses = [
  { id: 'KHO-A', name: 'Kho A - Chính', address: '12 Lê Văn Lương, P.Tân Phú, Q.7, TP.HCM', manager: 'Nguyễn Văn An', phone: '0901 234 567', locations: 120, used: 87, status: 'active', type: 'main' },
  { id: 'KHO-B', name: 'Kho B - Chính', address: '45 Phan Văn Hớn, P.Tân Thới Nhất, Q.12, TP.HCM', manager: 'Trần Thị Bình', phone: '0912 345 678', locations: 80, used: 52, status: 'active', type: 'main' },
  { id: 'KHO-C', name: 'Kho C - Phụ', address: '8 Nguyễn Oanh, P.17, Q.Gò Vấp, TP.HCM', manager: 'Lê Minh Đức', phone: '0923 456 789', locations: 40, used: 18, status: 'active', type: 'sub' },
  { id: 'KHO-D', name: 'Kho D - Phụ', address: '22 Đinh Bộ Lĩnh, P.26, Q.Bình Thạnh, TP.HCM', manager: 'Phạm Thu Hà', phone: '0934 567 890', locations: 30, used: 0, status: 'inactive', type: 'sub' },
];

const locations = [
  { id: 'LOC-001', warehouse: 'Kho A', zone: 'Khu A1', shelf: 'Kệ 01', row: 'Ngăn 01', box: 'Hộp K3', code: 'A1-01-K3', items: 3, capacity: 8, status: 'used' },
  { id: 'LOC-002', warehouse: 'Kho A', zone: 'Khu A1', shelf: 'Kệ 01', row: 'Ngăn 02', box: 'Hộp K1', code: 'A1-02-K1', items: 1, capacity: 8, status: 'used' },
  { id: 'LOC-003', warehouse: 'Kho A', zone: 'Khu A2', shelf: 'Kệ 03', row: 'Ngăn 01', box: 'Hộp K1', code: 'A2-03-K1', items: 1, capacity: 8, status: 'used' },
  { id: 'LOC-004', warehouse: 'Kho A', zone: 'Khu A3', shelf: 'Kệ 01', row: 'Ngăn 04', box: 'Hộp K4', code: 'A3-01-K4', items: 1, capacity: 8, status: 'used' },
  { id: 'LOC-005', warehouse: 'Kho A', zone: 'Khu A4', shelf: 'Kệ 02', row: 'Ngăn 03', box: 'Hộp K3', code: 'A4-02-K3', items: 2, capacity: 8, status: 'used' },
  { id: 'LOC-006', warehouse: 'Kho B', zone: 'Khu B1', shelf: 'Kệ 02', row: 'Ngăn 02', box: 'Hộp K2', code: 'B1-02-K2', items: 1, capacity: 8, status: 'used' },
  { id: 'LOC-007', warehouse: 'Kho B', zone: 'Khu B2', shelf: 'Kệ 01', row: 'Ngăn 01', box: 'Hộp K1', code: 'B2-01-K1', items: 1, capacity: 8, status: 'used' },
  { id: 'LOC-008', warehouse: 'Kho B', zone: 'Khu B3', shelf: 'Kệ 01', row: 'Ngăn 02', box: 'Hộp K2', code: 'B3-01-K2', items: 1, capacity: 8, status: 'used' },
  { id: 'LOC-009', warehouse: 'Kho B', zone: 'Khu B1', shelf: 'Kệ 03', row: 'Ngăn 05', box: 'Hộp K1', code: 'B1-03-K1', items: 0, capacity: 8, status: 'empty' },
  { id: 'LOC-010', warehouse: 'Kho A', zone: 'Khu A5', shelf: 'Kệ 01', row: 'Ngăn 01', box: 'Hộp K1', code: 'A5-01-K1', items: 0, capacity: 8, status: 'empty' },
];

export default function WarehousesPage() {
  const [tab, setTab] = useState<'warehouses' | 'locations'>('warehouses');
  const [whFilter, setWhFilter] = useState('all');

  const filteredLocs = locations.filter((l) => whFilter === 'all' || l.warehouse === whFilter);

  return (
    <PageLayout
      title="Kho & Vị trí lưu trữ"
      subtitle="Quản lý danh sách kho và sơ đồ vị trí lưu trữ"
      actions={
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'warehouses', label: 'Danh sách kho' },
              { value: 'locations', label: 'Vị trí lưu trữ' },
            ]}
          />
          <Btn>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            {tab === 'warehouses' ? 'Thêm kho' : 'Thêm vị trí'}
          </Btn>
        </>
      }
    >
      {tab === 'warehouses' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {warehouses.map((wh) => {
            const pct = Math.round((wh.used / wh.locations) * 100);
            return (
              <Card key={wh.id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{wh.name}</h3>
                      <p className="text-xs text-gray-400">{wh.id}</p>
                    </div>
                  </div>
                  <Badge color={wh.status === 'active' ? 'green' : 'gray'}>
                    {wh.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-start gap-2 text-gray-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-gray-400">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{wh.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{wh.manager} — {wh.phone}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Vị trí đang dùng</span>
                    <span className="font-semibold text-gray-700">{wh.used}/{wh.locations} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct > 80 ? 'var(--color-danger)' : pct > 60 ? 'var(--color-warning)' : 'var(--color-brand-from)',
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                    Xem chi tiết
                  </button>
                  <button className="flex-1 text-xs py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors font-medium">
                    Sơ đồ kho
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <select
              value={whFilter}
              onChange={(e) => setWhFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">Tất cả kho</option>
              <option value="Kho A">Kho A</option>
              <option value="Kho B">Kho B</option>
            </select>
            <span className="text-sm text-gray-400 ml-auto">{filteredLocs.length} vị trí</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Mã vị trí</Th>
                  <Th>Kho</Th>
                  <Th>Khu vực</Th>
                  <Th>Kệ</Th>
                  <Th>Ngăn</Th>
                  <Th>Hộp</Th>
                  <Th className="text-right">Vật tư</Th>
                  <Th>Trạng thái</Th>
                </tr>
              </thead>
              <tbody>
                {filteredLocs.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50/60 transition-colors">
                    <Td><code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{loc.code}</code></Td>
                    <Td>{loc.warehouse}</Td>
                    <Td>{loc.zone}</Td>
                    <Td>{loc.shelf}</Td>
                    <Td>{loc.row}</Td>
                    <Td>{loc.box}</Td>
                    <Td className="text-right">{loc.items}</Td>
                    <Td>
                      <Badge color={loc.status === 'used' ? 'indigo' : 'gray'}>
                        {loc.status === 'used' ? 'Đang dùng' : 'Trống'}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageLayout>
  );
}
