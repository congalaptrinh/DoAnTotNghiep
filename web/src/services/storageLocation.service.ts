import { request } from './apiClient';

export interface StorageLocation {
  location_id: string;
  warehouse_id: string;
  location_code: string;
  location_name: string | null;
  area: string | null;
  shelf: string | null;
  drawer: string | null;
  box: string | null;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface StorageLocationFilters {
  warehouse_id?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface StorageLocationInput {
  warehouse_id: string;
  location_code: string;
  location_name?: string;
  area?: string;
  shelf?: string;
  drawer?: string;
  box?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export function listStorageLocations(filters: StorageLocationFilters = {}): Promise<StorageLocation[]> {
  return request<StorageLocation[]>({ method: 'GET', url: '/storage-locations', params: filters });
}

export function createStorageLocation(data: StorageLocationInput): Promise<StorageLocation> {
  return request<StorageLocation>({ method: 'POST', url: '/storage-locations', data });
}

export function updateStorageLocation(id: string, data: Partial<StorageLocationInput>): Promise<StorageLocation> {
  return request<StorageLocation>({ method: 'PUT', url: `/storage-locations/${id}`, data });
}

/** Soft-delete: status -> INACTIVE. */
export function deleteStorageLocation(id: string): Promise<null> {
  return request<null>({ method: 'DELETE', url: `/storage-locations/${id}` });
}
