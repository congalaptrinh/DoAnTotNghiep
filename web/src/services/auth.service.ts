import { request } from './apiClient';
import type { UserRole } from '../types';

export interface AuthUser {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role_id: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  role: { role_id: string; role_name: UserRole; description: string };
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export function login(email: string, password: string): Promise<LoginResult> {
  return request<LoginResult>({ method: 'POST', url: '/auth/login', data: { email, password } });
}

export function getMe(): Promise<AuthUser> {
  return request<AuthUser>({ method: 'GET', url: '/auth/me' });
}
