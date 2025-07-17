import express from 'express';
import { getUserNotifications, markNotificationAsRead } from '../services/notificationService';

const router = express.Router();

// GET /api/notifications?userId=xxx
router.get('/', async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }
  try {
    const notifications = await getUserNotifications(userId);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  const id = req.params.id;
  try {
    const notification = await markNotificationAsRead(id);
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
