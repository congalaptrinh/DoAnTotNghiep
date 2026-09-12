import { request } from './apiClient';
import type { Item } from './item.service';
import type { StorageLocation } from './storageLocation.service';
import type { Supplier } from './supplier.service';
import type { OrderStatus } from './orders.service';

export interface ImportOrderItem {
  import_item_id: string;
  item_id: string;
  location_id: string;
  quantity: number;
  unit_price: string | null;
  batch_number: string | null;
  note: string | null;
  item: Item;
  location: StorageLocation;
}

export interface ImportOrder {
  import_id: string;
  import_code: string;
  supplier_id: string | null;
  warehouse_id: string;
  import_date: string;
  note: string | null;
  status: OrderStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  supplier: Supplier | null;
  warehouse: { warehouse_id: string; warehouse_name: string };
  creator: { user_id: string; full_name: string; email: string };
  items: ImportOrderItem[];
}

export interface ImportOrderItemInput {
  item_id: string;
  location_id: string;
  quantity: number;
  unit_price?: number;
  batch_number?: string;
  note?: string;
}

export interface ImportOrderInput {
  supplier_id?: string | null;
  warehouse_id: string;
  import_date?: string;
  note?: string;
  items: ImportOrderItemInput[];
}

export interface ImportOrderFilters {
  warehouse_id?: string;
  status?: OrderStatus;
}

export function listImportOrders(filters: ImportOrderFilters = {}): Promise<ImportOrder[]> {
  return request<ImportOrder[]>({ method: 'GET', url: '/import-orders', params: filters });
}

export function getImportOrder(id: string): Promise<ImportOrder> {
  return request<ImportOrder>({ method: 'GET', url: `/import-orders/${id}` });
}

export function createImportOrder(data: ImportOrderInput): Promise<ImportOrder> {
  return request<ImportOrder>({ method: 'POST', url: '/import-orders', data });
}

/** Luồng AI (F1): tạo phiếu VÀ xác nhận ngay trong 1 bước — xem 07-DECISIONS-LOG.md mục F2. */
export function createImportOrderFromAi(data: ImportOrderInput): Promise<ImportOrder> {
  return request<ImportOrder>({ method: 'POST', url: '/import-orders/from-ai', data });
}

export function confirmImportOrder(id: string): Promise<ImportOrder> {
  return request<ImportOrder>({ method: 'POST', url: `/import-orders/${id}/confirm` });
}
