import type { Page, UserRole } from '../types';

/**
 * Nguồn DUY NHẤT cho việc "role nào thấy trang nào" — khớp bảng phân quyền
 * `specs/00-OVERVIEW.md` mục 6. Không rải `if (role === 'admin')` ở nơi khác;
 * mọi chỗ cần kiểm tra quyền (Sidebar, route guard...) đều đọc từ đây qua
 * `usePermission()` (xem `hooks/usePermission.ts`).
 */
export const PAGE_ACCESS: Record<Page, UserRole[]> = {
  dashboard: ['admin', 'warehouse_manager', 'warehouse_staff', 'report_viewer'],
  inventory: ['admin', 'warehouse_manager', 'warehouse_staff', 'report_viewer'],
  categories: ['admin', 'warehouse_manager'],
  warehouses: ['admin', 'warehouse_manager', 'warehouse_staff'],
  suppliers: ['admin', 'warehouse_manager'],
  import: ['admin', 'warehouse_manager', 'warehouse_staff'],
  export: ['admin', 'warehouse_manager', 'warehouse_staff'],
  transfer: ['admin', 'warehouse_manager', 'warehouse_staff'],
  recovery: ['admin', 'warehouse_manager', 'warehouse_staff'],
  stocktake: ['admin', 'warehouse_manager'],
  disposal: ['admin', 'warehouse_manager'],
  history: ['admin', 'warehouse_manager', 'report_viewer'],
  users: ['admin'],
  roles: ['admin'],
};

export function canAccessPage(role: UserRole | null | undefined, page: Page): boolean {
  if (!role) return false;
  return PAGE_ACCESS[page].includes(role);
}
