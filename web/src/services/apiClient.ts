import axios, { type AxiosRequestConfig } from 'axios';

/**
 * Base client dùng chung cho MỌI lời gọi API tới Backend thật.
 * - Gắn JWT tự động vào header Authorization (đọc từ storage qua getToken()).
 * - baseURL đọc từ VITE_API_URL (.env), fallback về backend chạy local (PORT=5000, xem backend/.env).
 * - Backend luôn trả bọc `{ success, data, message }` (xem 02-BACKEND-SPEC.md) — unwrap tại request().
 * - 401 (token thiếu/hết hạn) => xoá token + gọi handler đã đăng ký (AuthContext, Giai đoạn C) để
 *   điều hướng về trang Login. apiClient KHÔNG tự import React Router để tránh phụ thuộc ngược.
 */

const TOKEN_STORAGE_KEY = 'wms.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    /* localStorage không khả dụng (ví dụ chế độ private) — bỏ qua, phiên chỉ tồn tại trong bộ nhớ */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* xem clearToken ở trên */
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** AuthContext (Giai đoạn C) gọi hàm này 1 lần lúc khởi tạo để nhận thông báo khi cần redirect về Login. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined;
    const message: string =
      error.response?.data?.message ?? error.message ?? 'Lỗi kết nối tới máy chủ';

    if (status === 401) {
      clearToken();
      unauthorizedHandler?.();
    }

    return Promise.reject(new ApiError(message, status));
  },
);

/** Gọi apiClient rồi unwrap thẳng field `data` bên trong envelope {success,data,message}. */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T>>(config);
  return response.data.data;
}
