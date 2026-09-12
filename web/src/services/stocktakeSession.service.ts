import { request } from './apiClient';
import type { Item } from './item.service';
import type { StorageLocation } from './storageLocation.service';
import type { OrderStatus } from './orders.service';

export interface StocktakeSessionItem {
  stocktake_item_id: string;
  item_id: string;
  location_id: string;
  /** Số lượng hệ thống — SNAPSHOT tại đúng thời điểm TẠO phiên (không phải số liệu live). */
  system_quantity: number;
  actual_quantity: number | null;
  difference: number | null;
  item: Item;
  location: StorageLocation;
}

export interface StocktakeSession {
  stocktake_id: string;
  stocktake_code: string;
  warehouse_id: string;
  stocktake_date: string;
  note: string | null;
  status: OrderStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  warehouse: { warehouse_id: string; warehouse_name: string };
  creator: { user_id: string; full_name: string; email: string };
  items: StocktakeSessionItem[];
}

export interface StocktakeSessionInput {
  warehouse_id: string;
  stocktake_date?: string;
  note?: string;
}

export interface StocktakeSessionFilters {
  warehouse_id?: string;
  status?: OrderStatus;
}

export function listStocktakeSessions(filters: StocktakeSessionFilters = {}): Promise<StocktakeSession[]> {
  return request<StocktakeSession[]>({ method: 'GET', url: '/stocktake-sessions', params: filters });
}

export function getStocktakeSession(id: string): Promise<StocktakeSession> {
  return request<StocktakeSession>({ method: 'GET', url: `/stocktake-sessions/${id}` });
}

/** Tạo phiên = snapshot TOÀN BỘ dòng inventory hiện có của kho tại đúng thời điểm gọi API này. */
export function createStocktakeSession(data: StocktakeSessionInput): Promise<StocktakeSession> {
  return request<StocktakeSession>({ method: 'POST', url: '/stocktake-sessions', data });
}

/** Có thể gọi nhiều lần trước khi confirm — mỗi lần chỉ gửi các dòng muốn cập nhật actual_quantity. */
export function updateStocktakeItems(id: string, items: { stocktake_item_id: string; actual_quantity: number }[]): Promise<StocktakeSession> {
  return request<StocktakeSession>({ method: 'PATCH', url: `/stocktake-sessions/${id}/items`, data: { items } });
}

/**
 * SET tuyệt đối tồn kho bằng actual_quantity đã lưu cho từng dòng còn chênh lệch — KHÔNG cộng/trừ.
 * Backend từ chối (400) nếu còn dòng chưa nhập actual_quantity.
 */
export function confirmStocktakeSession(id: string): Promise<StocktakeSession> {
  return request<StocktakeSession>({ method: 'POST', url: `/stocktake-sessions/${id}/confirm` });
}
