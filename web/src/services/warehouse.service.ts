import { request } from './apiClient';

export interface Warehouse {
  warehouse_id: string;
  warehouse_name: string;
  address: string | null;
  manager_id: string | null;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  manager: { user_id: string; full_name: string; email: string } | null;
}

/** Backend chưa hỗ trợ filter query — trả toàn bộ (kể cả INACTIVE), tự lọc ở client nếu cần. */
export function listWarehouses(): Promise<Warehouse[]> {
  return request<Warehouse[]>({ method: 'GET', url: '/warehouses' });
}
