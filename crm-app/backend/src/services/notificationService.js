/**
 * JavaScript wrapper for notificationService.ts
 * This file allows .mjs files to import from the TypeScript notification service
 */

// For now, export a simple notification function
export const createNotification = async (notification) => {
  try {
    console.log('📧 Notification created:', notification);
    // TODO: Implement actual notification logic
    return { id: Date.now(), ...notification, createdAt: new Date() };
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

export default { createNotification };
