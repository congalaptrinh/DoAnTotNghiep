import { request } from './apiClient';
import type { Item } from './item.service';
import type { StorageLocation } from './storageLocation.service';
import type { OrderStatus } from './orders.service';

export interface ExportOrderItem {
  export_item_id: string;
  item_id: string;
  location_id: string;
  quantity: number;
  note: string | null;
  item: Item;
  location: StorageLocation;
}

export interface ExportOrder {
  export_id: string;
  export_code: string;
  warehouse_id: string;
  export_date: string;
  purpose: string | null;
  project_name: string | null;
  note: string | null;
  status: OrderStatus;
  requested_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  warehouse: { warehouse_id: string; warehouse_name: string };
  requester: { user_id: string; full_name: string; email: string };
  approver: { user_id: string; full_name: string; email: string } | null;
  items: ExportOrderItem[];
}

export interface ExportOrderItemInput {
  item_id: string;
  location_id: string;
  quantity: number;
  note?: string;
}

export interface ExportOrderInput {
  warehouse_id: string;
  export_date?: string;
  purpose?: string;
  project_name?: string;
  note?: string;
  items: ExportOrderItemInput[];
}

export interface ExportOrderFilters {
  warehouse_id?: string;
  status?: OrderStatus;
}

export function listExportOrders(filters: ExportOrderFilters = {}): Promise<ExportOrder[]> {
  return request<ExportOrder[]>({ method: 'GET', url: '/export-orders', params: filters });
}

export function getExportOrder(id: string): Promise<ExportOrder> {
  return request<ExportOrder>({ method: 'GET', url: `/export-orders/${id}` });
}

export function createExportOrder(data: ExportOrderInput): Promise<ExportOrder> {
  return request<ExportOrder>({ method: 'POST', url: '/export-orders', data });
}

export function confirmExportOrder(id: string): Promise<ExportOrder> {
  return request<ExportOrder>({ method: 'POST', url: `/export-orders/${id}/confirm` });
}
