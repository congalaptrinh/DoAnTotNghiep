import { useAuth } from '../contexts/AuthContext';
import { canAccessPage } from '../config/permissions';
import type { Page } from '../types';

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role.role_name ?? null;

  return {
    role,
    canAccess: (page: Page) => canAccessPage(role, page),
  };
}
