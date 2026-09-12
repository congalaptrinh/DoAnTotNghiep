import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import type { Page } from '../types';

/**
 * Route guard (C5) — chặn truy cập TRỰC TIẾP bằng URL, không chỉ ẩn menu.
 * Áp dụng ở tầng route (không phải chỉ ẩn/hiện UI) nên gõ thẳng URL vào
 * thanh địa chỉ cũng bị chặn giống hệt việc bấm menu.
 */

export function RequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-from rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function Forbidden({ page }: { page: Page }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Không có quyền truy cập</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Tài khoản của bạn không có quyền xem trang <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/{page}</code>. Liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.
      </p>
    </div>
  );
}

export function PagePermission({ page, children }: { page: Page; children: ReactNode }) {
  const { canAccess } = usePermission();
  if (!canAccess(page)) return <Forbidden page={page} />;
  return <>{children}</>;
}
