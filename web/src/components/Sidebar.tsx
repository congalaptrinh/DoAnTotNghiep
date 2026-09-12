import type { ReactNode } from 'react';
import type { Page, UserRole } from '../types';
import { ROLE_LABELS } from '../types';
import { Avatar } from './ui';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  userName: string;
}

function IC({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  dashboard: <IC d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3h2m3 0h-2m-1-3v2m0 3v2" />,
  inventory: <IC d="M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4m0-14v14m8-14v10l-8 4" />,
  categories: <IC d="M4 6h16M4 10h16M4 14h10M4 18h7" />,
  warehouses: <IC d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />,
  suppliers: <IC d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H3m2 0h14M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  import: <IC d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
  export: <IC d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
  transfer: <IC d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />,
  recovery: <IC d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
  stocktake: <IC d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  disposal: <IC d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
  history: <IC d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  users: <IC d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 110 8 4 4 0 010-8z" />,
  roles: <IC d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  logout: <IC d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
};

function canSee(page: Page, role: UserRole): boolean {
  if (role === 'admin') return true;
  if (role === 'manager') return !['users', 'roles'].includes(page);
  if (role === 'staff') {
    return ['dashboard', 'inventory', 'warehouses', 'import', 'export', 'transfer', 'recovery'].includes(page);
  }
  if (role === 'viewer') return ['dashboard', 'inventory', 'history'].includes(page);
  return false;
}

function NavBtn({
  id, label, active, onClick, indent,
}: {
  id: string; label: string; active: boolean; onClick: () => void; indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all text-left ${
        indent ? 'pl-8 pr-3 py-1.5 text-[13px]' : 'px-3 py-2'
      } ${
        active
          ? 'bg-white/20 text-white shadow-sm'
          : 'text-white/65 hover:text-white hover:bg-white/10'
      }`}
    >
      <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-white/50'}`}>
        {ICONS[id]}
      </span>
      {label}
    </button>
  );
}

export default function Sidebar({ currentPage, onNavigate, userRole, onRoleChange, onLogout, userName }: Props) {
  const isActive = (page: Page) => currentPage === page;
  const isWarehouseActive = currentPage === 'warehouses';

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-40 overflow-hidden w-[220px] bg-gradient-to-b from-brand-from to-brand-to"
    >
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2.5 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4m0-14v14m8-14v10l-8 4" />
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">TechStore WMS</div>
          <div className="text-white/40 text-[11px]">v2.4.1</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {canSee('dashboard', userRole) && (
          <NavBtn id="dashboard" label="Dashboard" active={isActive('dashboard')} onClick={() => onNavigate('dashboard')} />
        )}
        {canSee('inventory', userRole) && (
          <NavBtn id="inventory" label="Tồn kho" active={isActive('inventory')} onClick={() => onNavigate('inventory')} />
        )}
        {canSee('categories', userRole) && (
          <NavBtn id="categories" label="Danh mục vật tư" active={isActive('categories')} onClick={() => onNavigate('categories')} />
        )}
        {canSee('warehouses', userRole) && (
          <NavBtn id="warehouses" label="Kho & vị trí" active={isWarehouseActive} onClick={() => onNavigate('warehouses')} />
        )}

        {/* Nghiệp vụ kho */}
        {(userRole === 'admin' || userRole === 'manager' || userRole === 'staff') && (
          <>
            <div className="px-3 pt-4 pb-1.5">
              <span className="text-white/35 text-[10px] font-semibold uppercase tracking-widest">Nghiệp vụ kho</span>
            </div>
            {canSee('import', userRole) && (
              <NavBtn id="import" label="Nhập kho" active={isActive('import')} onClick={() => onNavigate('import')} indent />
            )}
            {canSee('export', userRole) && (
              <NavBtn id="export" label="Xuất kho" active={isActive('export')} onClick={() => onNavigate('export')} indent />
            )}
            {canSee('transfer', userRole) && (
              <NavBtn id="transfer" label="Chuyển kho" active={isActive('transfer')} onClick={() => onNavigate('transfer')} indent />
            )}
            {canSee('recovery', userRole) && (
              <NavBtn id="recovery" label="Thu hồi" active={isActive('recovery')} onClick={() => onNavigate('recovery')} indent />
            )}
            {canSee('stocktake', userRole) && (
              <NavBtn id="stocktake" label="Kiểm kê" active={isActive('stocktake')} onClick={() => onNavigate('stocktake')} indent />
            )}
            {canSee('disposal', userRole) && (
              <NavBtn id="disposal" label="Thanh lý" active={isActive('disposal')} onClick={() => onNavigate('disposal')} indent />
            )}
          </>
        )}

        <div className="pt-3 space-y-0.5">
          {canSee('suppliers', userRole) && (
            <NavBtn id="suppliers" label="Nhà cung cấp" active={isActive('suppliers')} onClick={() => onNavigate('suppliers')} />
          )}
          {canSee('history', userRole) && (
            <NavBtn id="history" label="Lịch sử biến động" active={isActive('history')} onClick={() => onNavigate('history')} />
          )}
          {canSee('users', userRole) && (
            <NavBtn id="users" label="Người dùng" active={isActive('users')} onClick={() => onNavigate('users')} />
          )}
          {canSee('roles', userRole) && (
            <NavBtn id="roles" label="Vai trò" active={isActive('roles')} onClick={() => onNavigate('roles')} />
          )}
        </div>
      </nav>

      {/* Role switcher demo */}
      <div className="px-3 py-3 border-t border-white/10 flex-shrink-0">
        <div className="text-white/35 text-[10px] uppercase tracking-widest mb-1.5 px-1">Vai trò demo</div>
        <select
          value={userRole}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          className="w-full bg-white/10 text-white text-xs py-1.5 px-2 rounded-lg border border-white/20 focus:outline-none cursor-pointer"
        >
          <option value="admin" className="text-gray-900 bg-white">Quản trị viên (Admin)</option>
          <option value="manager" className="text-gray-900 bg-white">Quản lý kho</option>
          <option value="staff" className="text-gray-900 bg-white">Nhân viên kho</option>
          <option value="viewer" className="text-gray-900 bg-white">Người xem báo cáo</option>
        </select>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Avatar name={userName} color="brand" size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{userName}</div>
            <div className="text-white/45 text-[11px] truncate">{ROLE_LABELS[userRole]}</div>
          </div>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="text-white/45 hover:text-white transition-colors flex-shrink-0"
          >
            {ICONS.logout}
          </button>
        </div>
      </div>
    </aside>
  );
}
