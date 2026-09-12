import { request } from './apiClient';

export interface ItemCategory {
  category_id: string;
  category_name: string;
  parent_id: string | null;
  description: string | null;
}

export interface ItemCategoryInput {
  category_name: string;
  parent_id?: string | null;
  description?: string;
}

export function listItemCategories(): Promise<ItemCategory[]> {
  return request<ItemCategory[]>({ method: 'GET', url: '/item-categories' });
}

export function createItemCategory(data: ItemCategoryInput): Promise<ItemCategory> {
  return request<ItemCategory>({ method: 'POST', url: '/item-categories', data });
}

export function updateItemCategory(id: string, data: Partial<ItemCategoryInput>): Promise<ItemCategory> {
  return request<ItemCategory>({ method: 'PUT', url: `/item-categories/${id}`, data });
}

export function deleteItemCategory(id: string): Promise<null> {
  return request<null>({ method: 'DELETE', url: `/item-categories/${id}` });
}
