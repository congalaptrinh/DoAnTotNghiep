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
  /** report_viewer chỉ ĐỌC (0 nút Thêm/Sửa/Xoá — enforce qua `canWrite()`, không phải tách route riêng); xem 00-OVERVIEW.md mục 6 "...danh sách vật tư/thiết bị (read-only)" — quyết định + lý do đầy đủ trong 07-DECISIONS-LOG.md. */
  categories: ['admin', 'warehouse_manager', 'report_viewer'],
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

/**
 * Phân quyền GHI theo TỪNG RESOURCE thật của Backend — mịn hơn `PAGE_ACCESS`
 * (1 trang có thể gộp ≥2 resource qua tab, ví dụ `WarehousesPage` = warehouses
 * + storage_locations, `CategoriesPage` = item_categories + items — 2 resource
 * trong 1 trang có thể có quyền ghi KHÁC NHAU). Khớp CHÍNH XÁC middleware
 * `authorize(...)` của từng route thật — xem `backend/src/routes/*.js` +
 * `backend/src/utils/roles.js` (ADMIN_ONLY/MANAGE_ROLES/STAFF_WRITE_ROLES/
 * ALL_ROLES). Đọc (GET) mọi resource đều là `ALL_ROLES` (trừ users/roles là
 * ADMIN_ONLY) nên không cần map riêng cho đọc — chỉ cần map GHI (POST/PUT/
 * DELETE) vì đó là nơi có khác biệt cần phân biệt ở UI (nút Thêm/Sửa/Xoá).
 */
export const RESOURCE_WRITE_ACCESS = {
  users: ['admin'],
  roles: ['admin'],
  item_categories: ['admin', 'warehouse_manager'],
  items: ['admin', 'warehouse_manager'],
  warehouses: ['admin', 'warehouse_manager'],
  storage_locations: ['admin', 'warehouse_manager', 'warehouse_staff'],
  suppliers: ['admin', 'warehouse_manager'],
  import_orders: ['admin', 'warehouse_manager', 'warehouse_staff'],
  export_orders: ['admin', 'warehouse_manager', 'warehouse_staff'],
  transfer_orders: ['admin', 'warehouse_manager', 'warehouse_staff'],
  recovery_orders: ['admin', 'warehouse_manager', 'warehouse_staff'],
  stocktake_sessions: ['admin', 'warehouse_manager'],
  liquidation_orders: ['admin', 'warehouse_manager'],
  ai_detect: ['admin', 'warehouse_manager', 'warehouse_staff'],
} as const satisfies Record<string, UserRole[]>;

export type WritableResource = keyof typeof RESOURCE_WRITE_ACCESS;

export function canAccessPage(role: UserRole | null | undefined, page: Page): boolean {
  if (!role) return false;
  return PAGE_ACCESS[page].includes(role);
}

export function canWriteResource(role: UserRole | null | undefined, resource: WritableResource): boolean {
  if (!role) return false;
  return (RESOURCE_WRITE_ACCESS[resource] as readonly UserRole[]).includes(role);
}
