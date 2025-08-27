import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../authMiddleware.mjs';

dotenv.config();

const router = express.Router();

// Database connection
let pool;
try {
  pool = new pg.Pool({
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'asp_crm',
    user: process.env.DB_USER || 'asp_user',
    password: process.env.DB_PASSWORD || 'asp_password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} catch (error) {
  console.error('Failed to create database pool:', error);
}

// GET /api/notifications - Get real-time notifications based on recent activities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Generate dynamic notifications based on recent database activities
    const notifications = [];
    
    // Check for recently won deals
    const recentDealsQuery = `
      SELECT id, title, value, updated_at 
      FROM deals 
      WHERE stage = 'won' 
        AND updated_at >= NOW() - INTERVAL '24 hours'
      ORDER BY updated_at DESC 
      LIMIT 3
    `;
    
    // Check for new leads that need follow-up
    const followUpLeadsQuery = `
      SELECT COUNT(*) as count
      FROM leads 
      WHERE status = 'new' 
        AND created_at >= NOW() - INTERVAL '24 hours'
    `;
    
    // Check for leads that need follow-up (older than 24 hours without contact)
    const overDueLeadsQuery = `
      SELECT COUNT(*) as count
      FROM leads 
      WHERE status IN ('new', 'contacted') 
        AND updated_at <= NOW() - INTERVAL '24 hours'
    `;
    
    // Check for new customers
    const newCustomersQuery = `
      SELECT id, company_name, created_at
      FROM customers 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC 
      LIMIT 2
    `;
    
    const [recentDeals, followUpLeads, overDueLeads, newCustomers] = await Promise.all([
      pool.query(recentDealsQuery),
      pool.query(followUpLeadsQuery),
      pool.query(overDueLeadsQuery),
      pool.query(newCustomersQuery)
    ]);
    
    // Create notifications for recent deals
    recentDeals.rows.forEach((deal, index) => {
      notifications.push({
        id: `deal-${deal.id}`,
        type: 'success',
        title: 'Deal Closed!',
        message: `${deal.title} worth $${parseFloat(deal.value).toLocaleString()} just closed`,
        time: getTimeAgo(deal.updated_at),
        icon: 'trophy',
        priority: 'high'
      });
    });
    
    // Create notification for follow-up leads
    const followUpCount = parseInt(followUpLeads.rows[0].count);
    if (followUpCount > 0) {
      notifications.push({
        id: 'followup-leads',
        type: 'warning',
        title: 'Follow-up Required',
        message: `${followUpCount} new lead${followUpCount > 1 ? 's' : ''} need${followUpCount === 1 ? 's' : ''} attention`,
        time: 'Today',
        icon: 'clock',
        priority: 'medium'
      });
    }
    
    // Create notification for overdue leads
    const overDueCount = parseInt(overDueLeads.rows[0].count);
    if (overDueCount > 0) {
      notifications.push({
        id: 'overdue-leads',
        type: 'warning',
        title: 'Overdue Follow-ups',
        message: `${overDueCount} lead${overDueCount > 1 ? 's' : ''} haven't been contacted in 24+ hours`,
        time: 'Overdue',
        icon: 'alert-circle',
        priority: 'high'
      });
    }
    
    // Create notifications for new customers
    newCustomers.rows.forEach((customer, index) => {
      notifications.push({
        id: `customer-${customer.id}`,
        type: 'info',
        title: 'New Customer',
        message: `${customer.company_name} was added to the system`,
        time: getTimeAgo(customer.created_at),
        icon: 'users',
        priority: 'low'
      });
    });
    
    // Sort by priority and time, limit results
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const sortedNotifications = notifications
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, limit);
    
    res.json({ 
      success: true, 
      data: sortedNotifications,
      total: notifications.length
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
}

export default router;
