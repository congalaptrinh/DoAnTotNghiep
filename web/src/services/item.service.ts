import { request } from './apiClient';

export interface Item {
  item_id: string;
  item_code: string;
  item_name: string;
  item_type: string | null;
  category_id: string;
  unit: string;
  description: string | null;
  specifications: string | null;
  min_stock: number;
  max_stock: number | null;
  image_url: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  category: { category_id: string; category_name: string; parent_id: string | null; description: string | null };
}

export interface ItemFilters {
  category_id?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  search?: string;
}

export interface ItemInput {
  item_code: string;
  item_name: string;
  item_type?: string;
  category_id: string;
  unit: string;
  description?: string;
  specifications?: string;
  min_stock?: number;
  max_stock?: number;
  image_url?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export function listItems(filters: ItemFilters = {}): Promise<Item[]> {
  return request<Item[]>({ method: 'GET', url: '/items', params: filters });
}

export function createItem(data: ItemInput): Promise<Item> {
  return request<Item>({ method: 'POST', url: '/items', data });
}

export function updateItem(id: string, data: Partial<ItemInput>): Promise<Item> {
  return request<Item>({ method: 'PUT', url: `/items/${id}`, data });
}

/** Backend soft-delete: chuyển status -> INACTIVE (không xoá thật). */
export function deleteItem(id: string): Promise<null> {
  return request<null>({ method: 'DELETE', url: `/items/${id}` });
}
