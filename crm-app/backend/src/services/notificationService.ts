import { Notification } from '../types/notification';
import { db } from '../lib/db';

// Get notifications for a user from the database
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const rows = await db.any(
    `SELECT notification_id as id, user_id as "userId", title, message, read, created_at as "createdAt"
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  // Optionally add type and link if you add those columns
  return rows;
};

// Mark notification as read in the database
export const markNotificationAsRead = async (id: string): Promise<Notification | null> => {
  const row = await db.oneOrNone(
    `UPDATE notifications SET read = true WHERE notification_id = $1 RETURNING notification_id as id, user_id as "userId", title, message, read, created_at as "createdAt"`,
    [id]
  );
  return row;
};

// Create notification
export const createNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<Notification> => {
  const { userId, title, message } = notification;
  const row = await db.one(
    `INSERT INTO notifications (notification_id, user_id, title, message, read, created_at)
     VALUES (gen_random_uuid()::text, $1, $2, $3, false, NOW())
     RETURNING notification_id as id, user_id as "userId", title, message, read, created_at as "createdAt"`,
    [userId, title, message]
  );
  // Note: type and link are extracted but not used in current implementation
  return row;
};

// Get unread notifications count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const notifications = await getUserNotifications(userId);
  return notifications.filter(n => !n.read).length;
};