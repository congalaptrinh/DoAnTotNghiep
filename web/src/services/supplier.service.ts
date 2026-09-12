import { request } from './apiClient';

export interface Supplier {
  supplier_id: string;
  supplier_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface SupplierFilters {
  status?: 'ACTIVE' | 'INACTIVE';
  search?: string;
}

export interface SupplierInput {
  supplier_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export function listSuppliers(filters: SupplierFilters = {}): Promise<Supplier[]> {
  return request<Supplier[]>({ method: 'GET', url: '/suppliers', params: filters });
}

export function createSupplier(data: SupplierInput): Promise<Supplier> {
  return request<Supplier>({ method: 'POST', url: '/suppliers', data });
}

export function updateSupplier(id: string, data: Partial<SupplierInput>): Promise<Supplier> {
  return request<Supplier>({ method: 'PUT', url: `/suppliers/${id}`, data });
}

/** Soft-delete: status -> INACTIVE. */
export function deleteSupplier(id: string): Promise<null> {
  return request<null>({ method: 'DELETE', url: `/suppliers/${id}` });
}
