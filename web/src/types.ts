export type Page =
  | 'dashboard'
  | 'inventory'
  | 'categories'
  | 'warehouses'
  | 'suppliers'
  | 'import'
  | 'export'
  | 'transfer'
  | 'recovery'
  | 'stocktake'
  | 'disposal'
  | 'history'
  | 'users'
  | 'roles';

/** Khớp CHÍNH XÁC `role_name` thật của Backend (`backend/prisma/seed.js`, JWT payload `role`) — không dùng alias rút gọn để tránh lệch khi map qua lại. */
export type UserRole = 'admin' | 'warehouse_manager' | 'warehouse_staff' | 'report_viewer';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  warehouse_manager: 'Quản lý kho',
  warehouse_staff: 'Nhân viên kho',
  report_viewer: 'Người xem báo cáo',
};

export const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  inventory: 'Tồn kho',
  categories: 'Danh mục & Vật tư',
  warehouses: 'Kho & Vị trí',
  suppliers: 'Nhà cung cấp',
  import: 'Nhập kho',
  export: 'Xuất kho',
  transfer: 'Chuyển kho',
  recovery: 'Thu hồi',
  stocktake: 'Kiểm kê',
  disposal: 'Thanh lý',
  history: 'Lịch sử biến động',
  users: 'Người dùng',
  roles: 'Vai trò',
};
