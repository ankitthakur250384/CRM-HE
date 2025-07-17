import express from 'express';

const router = express.Router();

// Mock notifications for now
const mockNotifications = [
  {
    id: 'notif-1',
    userId: 'usr_admin',
    message: 'Welcome to ASP Cranes CRM!',
    read: false,
    createdAt: new Date().toISOString()
  }
];

// GET /api/notifications?userId=usr_admin
router.get('/', (req, res) => {
  const { userId } = req.query;
  const notifications = mockNotifications.filter(n => n.userId === userId);
  res.json({ success: true, data: notifications });
});

export default router;
