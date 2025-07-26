
import { User } from '../types/auth';
import { api } from '../lib/apiService';

export const getUsers = async (): Promise<{ users: User[] }> => {
  const users = await api.get<User[]>('/users');
  return { users };
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  return await api.post<User>('/users', userData);
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  return await api.put<User>(`/users/${id}`, userData);
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};
