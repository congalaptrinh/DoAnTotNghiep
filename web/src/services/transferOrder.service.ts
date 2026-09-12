import { request } from './apiClient';
import type { Item } from './item.service';
import type { StorageLocation } from './storageLocation.service';
import type { OrderStatus } from './orders.service';

export interface TransferOrderItem {
  transfer_item_id: string;
  item_id: string;
  from_location_id: string;
  to_location_id: string;
  quantity: number;
  note: string | null;
  item: Item;
  from_location: StorageLocation;
  to_location: StorageLocation;
}

export interface TransferOrder {
  transfer_id: string;
  transfer_code: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  transfer_date: string;
  note: string | null;
  status: OrderStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  from_warehouse: { warehouse_id: string; warehouse_name: string };
  to_warehouse: { warehouse_id: string; warehouse_name: string };
  creator: { user_id: string; full_name: string; email: string };
  items: TransferOrderItem[];
}

export interface TransferOrderItemInput {
  item_id: string;
  from_location_id: string;
  to_location_id: string;
  quantity: number;
  note?: string;
}

export interface TransferOrderInput {
  from_warehouse_id: string;
  to_warehouse_id: string;
  transfer_date?: string;
  note?: string;
  items: TransferOrderItemInput[];
}

export interface TransferOrderFilters {
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  status?: OrderStatus;
}

export function listTransferOrders(filters: TransferOrderFilters = {}): Promise<TransferOrder[]> {
  return request<TransferOrder[]>({ method: 'GET', url: '/transfer-orders', params: filters });
}

export function createTransferOrder(data: TransferOrderInput): Promise<TransferOrder> {
  return request<TransferOrder>({ method: 'POST', url: '/transfer-orders', data });
}

export function confirmTransferOrder(id: string): Promise<TransferOrder> {
  return request<TransferOrder>({ method: 'POST', url: `/transfer-orders/${id}/confirm` });
}
