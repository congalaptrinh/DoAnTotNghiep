import { request } from './apiClient';
import type { UserRole } from '../types';

export interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role_id: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  role: { role_id: string; role_name: UserRole; description: string | null };
}

export interface UserInput {
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  role_id: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export function listUsers(): Promise<User[]> {
  return request<User[]>({ method: 'GET', url: '/users' });
}

export function createUser(data: UserInput & { password: string }): Promise<User> {
  return request<User>({ method: 'POST', url: '/users', data });
}

export function updateUser(id: string, data: Partial<UserInput>): Promise<User> {
  return request<User>({ method: 'PUT', url: `/users/${id}`, data });
}

/** Backend soft-delete: chuyển status -> INACTIVE (khoá tài khoản, không xoá thật). */
export function deleteUser(id: string): Promise<null> {
  return request<null>({ method: 'DELETE', url: `/users/${id}` });
}
