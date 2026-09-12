import { useAuth } from '../contexts/AuthContext';
import { canAccessPage, canWriteResource, type WritableResource } from '../config/permissions';
import type { Page } from '../types';

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role.role_name ?? null;

  return {
    role,
    /** Có thấy trang này không (route guard + menu sidebar). */
    canAccess: (page: Page) => canAccessPage(role, page),
    /**
     * Có quyền GHI (tạo/sửa/xoá) resource này không — dùng để ẩn/khoá từng
     * nút hành động BÊN TRONG 1 trang, mịn hơn `canAccess`. Bắt buộc dùng
     * riêng cho các trang gộp ≥2 resource qua tab có quyền ghi khác nhau
     * (`WarehousesPage`: warehouses vs storage_locations).
     */
    canWrite: (resource: WritableResource) => canWriteResource(role, resource),
  };
}
