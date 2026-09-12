import { useQuery } from '@tanstack/react-query';
import PageLayout, { Card, Badge } from '../components/PageLayout';
import { Avatar, EmptyState } from '../components/ui';
import { ApiError } from '../services/apiClient';
import { listRoles } from '../services/role.service';
import { listUsers } from '../services/user.service';
import { PAGE_ACCESS, RESOURCE_WRITE_ACCESS, type WritableResource } from '../config/permissions';
import { PAGE_TITLES, type Page, type UserRole } from '../types';

const roleColors: Record<UserRole, 'indigo' | 'blue' | 'green' | 'gray'> = {
  admin: 'indigo', warehouse_manager: 'blue', warehouse_staff: 'green', report_viewer: 'gray',
};

/** Trang nào ứng với resource ghi nào — chỉ map các trang có phân biệt quyền ghi rõ ràng (RESOURCE_WRITE_ACCESS). */
const PAGE_WRITE_RESOURCE: Partial<Record<Page, WritableResource>> = {
  categories: 'items',
  warehouses: 'warehouses',
  suppliers: 'suppliers',
  import: 'import_orders',
  export: 'export_orders',
  transfer: 'transfer_orders',
  recovery: 'recovery_orders',
  stocktake: 'stocktake_sessions',
  disposal: 'liquidation_orders',
  users: 'users',
  roles: 'roles',
};

const ALL_PAGES = Object.keys(PAGE_ACCESS) as Page[];

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function RolesPage() {
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: listRoles });
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const roles = rolesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const isLoading = rolesQuery.isLoading || usersQuery.isLoading;

  return (
    <PageLayout
      title="Vai trò"
      subtitle="Phân quyền theo vai trò trong hệ thống — dữ liệu lấy trực tiếp từ cấu hình phân quyền thật (config/permissions.ts)"
    >
      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
      ) : rolesQuery.error ? (
        <EmptyState title="Không tải được dữ liệu" description={errMsg(rolesQuery.error, 'Lỗi không xác định')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {roles.map((role) => {
            const color = roleColors[role.role_name] ?? 'gray';
            const userCount = users.filter((u) => u.role_id === role.role_id).length;
            const accessiblePages = ALL_PAGES.filter((p) => PAGE_ACCESS[p].includes(role.role_name));

            return (
              <Card key={role.role_id} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={role.description ?? role.role_name} color={color} size="md" />
                  <div>
                    <h3 className="font-bold text-gray-900">{role.description ?? role.role_name}</h3>
                    <Badge color={color}>{userCount} người dùng</Badge>
                  </div>
                </div>

                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Truy cập được {accessiblePages.length}/{ALL_PAGES.length} trang
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {accessiblePages.map((page) => {
                    const resource = PAGE_WRITE_RESOURCE[page];
                    const canWrite = resource ? (RESOURCE_WRITE_ACCESS[resource] as readonly UserRole[]).includes(role.role_name) : null;
                    return (
                      <span
                        key={page}
                        className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 ${
                          canWrite === false ? 'bg-gray-50 border-gray-100 text-gray-500' : 'bg-green-50 border-green-100 text-green-700'
                        }`}
                        title={canWrite === false ? 'Chỉ xem, không có quyền ghi' : canWrite === true ? 'Có quyền xem + ghi' : 'Trang chỉ đọc'}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                          {canWrite === false ? <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> : <path d="M5 13l4 4L19 7" />}
                        </svg>
                        {PAGE_TITLES[page]}
                      </span>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
