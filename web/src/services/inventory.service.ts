import { request } from './apiClient';

export interface InventoryRow {
  inventory_id: string;
  item_id: string;
  warehouse_id: string;
  location_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  updated_at: string;
  item: { item_id: string; item_code: string; item_name: string; unit: string; min_stock: number; max_stock: number | null };
  warehouse: { warehouse_id: string; warehouse_name: string };
  location: { location_id: string; location_code: string; location_name: string | null };
}

export interface InventoryFilters {
  item_id?: string;
  warehouse_id?: string;
  location_id?: string;
}

export function listInventory(filters: InventoryFilters = {}): Promise<InventoryRow[]> {
  return request<InventoryRow[]>({ method: 'GET', url: '/inventory', params: filters });
}
