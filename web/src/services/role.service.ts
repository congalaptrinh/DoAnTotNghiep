import { request } from './apiClient';
import type { UserRole } from '../types';

export interface Role {
  role_id: string;
  role_name: UserRole;
  description: string | null;
}

/** G3: chỉ danh sách (theo đúng phạm vi checklist) — Backend có sẵn CRUD đầy đủ nhưng chưa cần dùng tới ở Web. */
export function listRoles(): Promise<Role[]> {
  return request<Role[]>({ method: 'GET', url: '/roles' });
}
