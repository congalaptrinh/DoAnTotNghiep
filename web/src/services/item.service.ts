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
}

export interface ItemFilters {
  category_id?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  search?: string;
}

export function listItems(filters: ItemFilters = {}): Promise<Item[]> {
  return request<Item[]>({ method: 'GET', url: '/items', params: filters });
}
