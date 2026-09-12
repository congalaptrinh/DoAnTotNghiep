import { useNavigate } from 'react-router-dom';
import type { Page } from '../types';
import { Card } from '../components/PageLayout';
import { StatCard } from '../components/ui';

const weeklyData = [
  { day: 'T2', nhap: 45, xuat: 32 },
  { day: 'T3', nhap: 62, xuat: 48 },
  { day: 'T4', nhap: 38, xuat: 55 },
  { day: 'T5', nhap: 71, xuat: 41 },
  { day: 'T6', nhap: 55, xuat: 63 },
  { day: 'T7', nhap: 28, xuat: 19 },
  { day: 'CN', nhap: 15, xuat: 8 },
];

const recentActivity = [
  { time: '09:42', type: 'import', desc: 'Nhập kho #NK-2025-0891: 150 IC555 Timer từ Bách Khoa Electronics', user: 'Trần Văn Bình', color: 'bg-green-100 text-green-700' },
  { time: '08:30', type: 'export', desc: 'Xuất kho #XK-2025-0445: 20 Arduino Uno R3 cho dự án IoT Lab', user: 'Lê Thị Hoa', color: 'bg-red-100 text-red-700' },
  { time: 'Hôm qua', type: 'warning', desc: 'Cảnh báo: Tụ 100μF 16V còn 45 cái — dưới ngưỡng tối thiểu (50)', user: 'Hệ thống', color: 'bg-amber-100 text-amber-700' },
  { time: 'Hôm qua', type: 'transfer', desc: 'Chuyển kho #CK-2025-0112: 30 Relay 5V từ Kho A → Kho B', user: 'Nguyễn Văn An', color: 'bg-blue-100 text-blue-700' },
  { time: '2 ngày trước', type: 'stocktake', desc: 'Hoàn tất kiểm kê #KK-2025-0023 tại Kho A — phát hiện +2 ESP32', user: 'Phạm Thanh Tú', color: 'bg-yellow-100 text-yellow-700' },
];

function WeeklyChart() {
  const maxVal = 80;
  const chartH = 120;
  const barW = 22;
  const gap = 6;
  const groupW = barW * 2 + gap + 20;
  const totalW = weeklyData.length * groupW;

  return (
    <svg viewBox={`0 0 ${totalW} ${chartH + 28}`} className="w-full">
      {weeklyData.map((d, i) => {
        const x = i * groupW + 10;
        const nhapH = (d.nhap / maxVal) * chartH;
        const xuatH = (d.xuat / maxVal) * chartH;
        return (
          <g key={d.day}>
            <rect x={x} y={chartH - nhapH} width={barW} height={nhapH} fill="var(--color-brand-from)" rx={4} opacity={0.85} />
            <rect x={x + barW + gap} y={chartH - xuatH} width={barW} height={xuatH} fill="var(--color-brand-to)" rx={4} opacity={0.85} />
            <text x={x + barW + gap / 2} y={chartH + 18} textAnchor="middle" fontSize={11} fill="#9CA3AF">{d.day}</text>
          </g>
        );
      })}
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={0} y1={chartH - f * chartH}
          x2={totalW} y2={chartH - f * chartH}
          stroke="#F3F4F6" strokeWidth={1}
        />
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const onNavigate = (page: Page) => navigate(`/${page}`);
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const stats = [
    { label: 'Tổng vật tư', value: '1,284', sub: '↑ 23 trong tuần này', color: 'brand' as const, icon: 'M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4m0-14v14m8-14v10l-8 4', page: 'inventory' as Page },
    { label: 'Sắp hết hàng', value: '7', sub: '3 mặt hàng cần đặt gấp', color: 'danger' as const, icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', page: 'inventory' as Page },
    { label: 'Phiếu chờ duyệt', value: '12', sub: '5 nhập kho, 7 xuất kho', color: 'warning' as const, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', page: 'import' as Page },
    { label: 'Số kho hoạt động', value: '4', sub: '2 kho chính, 2 kho phụ', color: 'success' as const, icon: 'M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3', page: 'warehouses' as Page },
  ];

  return (
    <div className="min-h-full">
      {/* Hero banner */}
      <div className="px-8 py-8 relative overflow-hidden bg-gradient-to-br from-brand-from to-brand-to">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-white/5 translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-white/60 text-sm mb-1">{today}</p>
          <h1 className="text-white text-2xl font-bold mb-1">
            Chào buổi sáng, Cao Xuân Khu 👋
          </h1>
          <p className="text-white/70 text-sm">
            Hệ thống hoạt động bình thường. Có 12 phiếu đang chờ bạn phê duyệt.
          </p>
        </div>

        {/* Stat cards overlap hero */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              variant="hero"
              label={s.label}
              value={s.value}
              sub={s.sub}
              icon={s.icon}
              color={s.color}
              onClick={() => onNavigate(s.page)}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Nhập / Xuất theo tuần</h3>
              <p className="text-xs text-gray-400 mt-0.5">Tuần 36 — 2/9 đến 8/9/2025</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-brand-from inline-block" />
                Nhập kho
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-brand-to inline-block" />
                Xuất kho
              </span>
            </div>
          </div>
          <WeeklyChart />
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
            <span>Tổng nhập: <b className="text-brand-from font-semibold">314 đơn vị</b></span>
            <span>Tổng xuất: <b className="text-brand-to font-semibold">266 đơn vị</b></span>
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Tạo phiếu nhập kho', page: 'import' as Page, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100', desc: 'Nhập kho có AI hỗ trợ' },
              { label: 'Tạo phiếu xuất kho', page: 'export' as Page, color: 'text-violet-600 bg-violet-50 hover:bg-violet-100', desc: 'Xuất kho theo yêu cầu' },
              { label: 'Kiểm tra tồn kho', page: 'inventory' as Page, color: 'text-green-600 bg-green-50 hover:bg-green-100', desc: 'Xem trạng thái chi tiết' },
              { label: 'Xem lịch sử biến động', page: 'history' as Page, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100', desc: 'Theo dõi mọi giao dịch' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => onNavigate(action.page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${action.color}`}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{action.desc}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </Card>

        {/* Activity feed */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5 ${item.color}`}>
                  {item.time}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{item.desc}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.user}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Low stock alert */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Cảnh báo tồn kho thấp</h3>
          <div className="space-y-3">
            {[
              { name: 'Tụ 100μF 16V', current: 45, min: 50, unit: 'cái' },
              { name: 'Relay 5V 10A', current: 3, min: 10, unit: 'cái' },
              { name: 'Module L298N', current: 2, min: 5, unit: 'cái' },
              { name: 'Cầu chì 5A', current: 18, min: 20, unit: 'cái' },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                  <span className="text-xs text-red-600 font-semibold">{item.current}/{item.min} {item.unit}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min(100, (item.current / item.min) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="mt-4 w-full text-xs text-indigo-600 font-medium hover:underline text-center"
          >
            Xem tất cả cảnh báo →
          </button>
        </Card>
      </div>
    </div>
  );
}
