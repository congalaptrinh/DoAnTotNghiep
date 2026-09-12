import { useNavigate } from 'react-router-dom';
import type { Page } from '../types';
import { Card } from '../components/PageLayout';
import { StatCard, EmptyState } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';

function WeeklyChart({ data }: { data: { day: string; nhap: number; xuat: number }[] }) {
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.nhap, d.xuat)));
  const chartH = 120;
  const barW = 22;
  const gap = 6;
  const groupW = barW * 2 + gap + 20;
  const totalW = data.length * groupW;

  return (
    <svg viewBox={`0 0 ${totalW} ${chartH + 28}`} className="w-full">
      {data.map((d, i) => {
        const x = i * groupW + 10;
        const nhapH = (d.nhap / maxVal) * chartH;
        const xuatH = (d.xuat / maxVal) * chartH;
        return (
          <g key={i}>
            <rect x={x} y={chartH - nhapH} width={barW} height={nhapH} fill="var(--color-brand-from)" rx={4} opacity={0.85} />
            <rect x={x + barW + gap} y={chartH - xuatH} width={barW} height={xuatH} fill="var(--color-brand-to)" rx={4} opacity={0.85} />
            <text x={x + barW + gap / 2} y={chartH + 18} textAnchor="middle" fontSize={11} fill="#9CA3AF">{d.day}</text>
          </g>
        );
      })}
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={0} y1={chartH - f * chartH} x2={totalW} y2={chartH - f * chartH} stroke="#F3F4F6" strokeWidth={1} />
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const onNavigate = (page: Page) => navigate(`/${page}`);
  const { user } = useAuth();
  const stats = useDashboardStats();
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (stats.isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-from rounded-full animate-spin" />
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="p-6">
        <EmptyState title="Không tải được dữ liệu Dashboard" description={(stats.error as Error).message} />
      </div>
    );
  }

  const statCards = [
    { label: 'Tổng vật tư', value: stats.totalItems.toLocaleString('vi-VN'), sub: 'Vật tư đang hoạt động', color: 'brand' as const, icon: 'M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4m0-14v14m8-14v10l-8 4', page: 'inventory' as Page },
    { label: 'Sắp hết hàng', value: stats.lowStockCount.toLocaleString('vi-VN'), sub: stats.lowStockCount > 0 ? `${stats.lowStockCount} vị trí dưới ngưỡng tối thiểu` : 'Không có cảnh báo', color: 'danger' as const, icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', page: 'inventory' as Page },
    { label: 'Phiếu chờ xử lý', value: stats.pendingTotal.toLocaleString('vi-VN'), sub: stats.pendingSummary, color: 'warning' as const, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', page: 'import' as Page },
    { label: 'Số kho hoạt động', value: stats.activeWarehousesCount.toLocaleString('vi-VN'), sub: `Tổng ${stats.totalWarehousesCount} kho`, color: 'success' as const, icon: 'M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3', page: 'warehouses' as Page },
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
            Chào buổi sáng, {user?.full_name} 👋
          </h1>
          <p className="text-white/70 text-sm">
            {stats.pendingTotal > 0
              ? `Có ${stats.pendingTotal} phiếu đang chờ xử lý.`
              : 'Không có phiếu nào đang chờ xử lý.'}
          </p>
        </div>

        {/* Stat cards overlap hero */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {statCards.map((s) => (
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
              <p className="text-xs text-gray-400 mt-0.5">7 ngày gần nhất</p>
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
          <WeeklyChart data={stats.weeklyChart} />
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
            <span>Tổng nhập: <b className="text-brand-from font-semibold">{stats.totalImportWeek.toLocaleString('vi-VN')} đơn vị</b></span>
            <span>Tổng xuất: <b className="text-brand-to font-semibold">{stats.totalExportWeek.toLocaleString('vi-VN')} đơn vị</b></span>
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
          {stats.recentActivity.length === 0 ? (
            <EmptyState title="Chưa có hoạt động nào" description="Trong 30 ngày gần đây chưa có biến động kho nào được ghi nhận." />
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5 bg-indigo-50 text-brand-from">
                    {item.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{item.desc}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.user}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Low stock alert */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Cảnh báo tồn kho thấp</h3>
          {stats.lowStockPreview.length === 0 ? (
            <p className="text-sm text-gray-400">Không có vật tư nào dưới ngưỡng tối thiểu.</p>
          ) : (
            <div className="space-y-3">
              {stats.lowStockPreview.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                    <span className="text-xs text-danger font-semibold">{item.current}/{item.min} {item.unit}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-danger rounded-full"
                      style={{ width: `${Math.min(100, (item.current / Math.max(1, item.min)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => onNavigate('inventory')}
            className="mt-4 w-full text-xs text-brand-from font-medium hover:underline text-center"
          >
            Xem tất cả cảnh báo →
          </button>
        </Card>
      </div>
    </div>
  );
}
