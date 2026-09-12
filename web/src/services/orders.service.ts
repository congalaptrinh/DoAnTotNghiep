import { request } from './apiClient';

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

/**
 * Cả 6 loại phiếu nghiệp vụ kho (Nhập/Xuất/Chuyển/Thu hồi/Kiểm kê/Thanh lý) đều
 * có endpoint `GET /api/<resource>?status=` hình dạng GIỐNG HỆT nhau (xem
 * `backend/src/routes/*.js`) — gom 1 hàm chung thay vì lặp code cho 6 resource.
 * Khi từng nghiệp vụ cần thêm hàm riêng (create/confirm) ở Giai đoạn E-F, tạo
 * file `*.service.ts` riêng cho resource đó và có thể tái dùng `listOrders` bên
 * trong nếu muốn.
 */
export type OrderResource =
  | 'import-orders'
  | 'export-orders'
  | 'transfer-orders'
  | 'recovery-orders'
  | 'stocktake-sessions'
  | 'liquidation-orders';

export interface OrderSummary {
  status: OrderStatus;
  warehouse_id?: string;
  [key: string]: unknown;
}

export function listOrders(resource: OrderResource, filters: { status?: OrderStatus; warehouse_id?: string } = {}): Promise<OrderSummary[]> {
  return request<OrderSummary[]>({ method: 'GET', url: `/${resource}`, params: filters });
}
