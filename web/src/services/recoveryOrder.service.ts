import { request } from './apiClient';
import type { Item } from './item.service';
import type { StorageLocation } from './storageLocation.service';
import type { OrderStatus } from './orders.service';

export interface RecoveryOrderItem {
  recovery_item_id: string;
  item_id: string;
  location_id: string;
  quantity: number;
  note: string | null;
  item: Item;
  location: StorageLocation;
}

export interface RecoveryOrder {
  recovery_id: string;
  recovery_code: string;
  warehouse_id: string;
  recovery_date: string;
  reason: string | null;
  note: string | null;
  status: OrderStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  warehouse: { warehouse_id: string; warehouse_name: string };
  creator: { user_id: string; full_name: string; email: string };
  items: RecoveryOrderItem[];
}

export interface RecoveryOrderItemInput {
  item_id: string;
  location_id: string;
  quantity: number;
  note?: string;
}

export interface RecoveryOrderInput {
  warehouse_id: string;
  recovery_date?: string;
  reason?: string;
  note?: string;
  items: RecoveryOrderItemInput[];
}

export interface RecoveryOrderFilters {
  warehouse_id?: string;
  status?: OrderStatus;
}

export function listRecoveryOrders(filters: RecoveryOrderFilters = {}): Promise<RecoveryOrder[]> {
  return request<RecoveryOrder[]>({ method: 'GET', url: '/recovery-orders', params: filters });
}

export function createRecoveryOrder(data: RecoveryOrderInput): Promise<RecoveryOrder> {
  return request<RecoveryOrder>({ method: 'POST', url: '/recovery-orders', data });
}

export function confirmRecoveryOrder(id: string): Promise<RecoveryOrder> {
  return request<RecoveryOrder>({ method: 'POST', url: `/recovery-orders/${id}/confirm` });
}
