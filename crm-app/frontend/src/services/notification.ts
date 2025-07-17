import { getHeaders } from './apiHeaders';
import type { Notification } from '../types/notification';

// Fetch notifications for a user from backend API
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/notifications?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const result = await res.json();
  // Support both array and {data: array} responses
  const notifications = Array.isArray(result)
    ? result
    : Array.isArray(result.data)
      ? result.data
      : [];
  return notifications;
}

// Mark notification as read via backend API
export async function markNotificationAsRead(id: string): Promise<Notification | null> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return await res.json();
}
