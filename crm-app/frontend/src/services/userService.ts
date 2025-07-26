
import { User } from '../types/auth';
import { api } from '../lib/apiService';

export const getUsers = async (): Promise<{ users: User[] }> => {
  const users = await api.get<User[]>('/api/users');
  return { users };
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  return await api.post<User>('/api/users', userData);
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  return await api.put<User>(`/api/users/${id}`, userData);
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/api/users/${id}`);
};
