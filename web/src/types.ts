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

export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  manager: 'Quản lý kho',
  staff: 'Nhân viên kho',
  viewer: 'Người xem báo cáo',
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
