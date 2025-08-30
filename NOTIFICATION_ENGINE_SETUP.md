# Notification Engine Setup Guide

## Overview
The ASP Cranes CRM now includes a comprehensive notification engine that automates notifications across multiple channels (in-app, email, SMS). This guide covers setup, configuration, and deployment.

## Features
- **Multi-channel notifications**: In-app (WebSocket), Email (SMTP), SMS (Twilio)
- **Template system**: Customizable notification templates with dynamic data
- **Rule-based routing**: Automatic channel selection based on user preferences and notification types
- **Scheduled notifications**: Queue and schedule notifications for future delivery
- **Real-time delivery**: Instant WebSocket notifications for immediate alerts
- **Event-driven**: Automatic notifications for lead creation, job assignments, and completions
- **User preferences**: Customizable notification settings per user
- **Analytics**: Comprehensive notification delivery tracking and reporting

## Database Setup

### 1. Run Schema Updates
First, apply the enhanced notification schema to your database:

```bash
# Using psql (replace with your database credentials)
psql -h localhost -d aspcranes -U your_username -f enhanced_notifications_schema.sql

# Or using your existing database connection
# Import the SQL file through your database management tool
```

### 2. Verify Schema Installation
Check that the following tables were created:
- `notification_templates`
- `notification_rules`
- `scheduled_notifications`
- `notification_logs`
- `user_notification_preferences`

## Environment Configuration

### 1. Email Configuration (SMTP)
Add these environment variables to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=ASP Cranes CRM <your-email@gmail.com>

# For Gmail: Use App Passwords instead of regular password
# For other providers: Adjust SMTP settings accordingly
```

### 2. SMS Configuration (Twilio)
Add these environment variables:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Notification Engine Settings
Optional configuration:

```env
# Notification Engine Settings
NOTIFICATION_BATCH_SIZE=50
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY=5000
SCHEDULED_PROCESSOR_INTERVAL=60000
```

## Package Installation

Install required dependencies:

```bash
cd crm-app/backend
npm install nodemailer twilio ws
```

## Service Configuration

### 1. Gmail SMTP Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `SMTP_PASS`

### 2. Twilio SMS Setup
1. Create a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token from the dashboard
3. Purchase a phone number for SMS sending
4. Add credentials to environment variables

### 3. Alternative Email Providers
For other email providers, adjust SMTP settings:

```env
# Outlook/Hotmail
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587

# Yahoo
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587

# Custom SMTP
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=true  # for port 465
```

## Testing the Setup

### 1. Start the Server
```bash
cd crm-app/backend
npm run dev
```

Look for these initialization messages:
```
🚀 API server running at http://localhost:3001
✅ Notification Engine initialized successfully
- WebSocket: ws://localhost:3001 (real-time notifications)
```

### 2. Test Notifications
Use the API endpoints to test functionality:

```bash
# Test in-app notification
curl -X POST http://localhost:3001/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": 1,
    "type": "info",
    "title": "Test Notification",
    "message": "Testing the notification system",
    "channels": ["in_app"]
  }'

# Check user notifications
curl http://localhost:3001/api/notifications/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Email Notifications
```bash
curl -X POST http://localhost:3001/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": 1,
    "type": "info",
    "title": "Email Test",
    "message": "Testing email delivery",
    "channels": ["email"]
  }'
```

### 4. Test SMS Notifications
```bash
curl -X POST http://localhost:3001/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": 1,
    "type": "info",
    "title": "SMS Test",
    "message": "Testing SMS delivery",
    "channels": ["sms"]
  }'
```

## Automatic Notifications

The system now automatically sends notifications for:

### 1. Lead Management
- **Lead Created**: Notifies assigned sales representatives
- **Lead Updated**: Notifies stakeholders of status changes
- **Lead Converted**: Celebrates successful conversions

### 2. Job Management
- **Job Assigned**: Notifies operators of new assignments
- **Job Completed**: Notifies managers of completion
- **Job Delayed**: Alerts about schedule changes

### 3. Quotation Process
- **Quotation Created**: Notifies sales team
- **Quotation Approved**: Notifies customers and operations
- **Quotation Expired**: Alerts for follow-up actions

## User Preferences

Users can customize their notification preferences:

```bash
# Set user preferences
curl -X PUT http://localhost:3001/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "emailEnabled": true,
    "smsEnabled": false,
    "inAppEnabled": true,
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00"
    }
  }'
```

## Analytics and Monitoring

### View Notification Analytics
```bash
# Get delivery analytics
curl http://localhost:3001/api/notifications/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get notification logs
curl http://localhost:3001/api/notifications/logs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Monitor System Health
Check the console logs for:
- Notification engine initialization
- WebSocket connections
- Email/SMS delivery status
- Scheduled notification processing

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Verify SMTP credentials
   - Check Gmail App Password setup
   - Review firewall settings

2. **SMS not sending**
   - Verify Twilio credentials
   - Check phone number format (+1234567890)
   - Ensure Twilio account has credits

3. **WebSocket not connecting**
   - Check server initialization logs
   - Verify port 3001 is accessible
   - Test WebSocket connection with browser tools

4. **Database errors**
   - Ensure schema updates were applied
   - Check PostgreSQL connection
   - Verify table permissions

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
DEBUG=notification:*
```

## Production Deployment

### 1. Environment Setup
- Use secure SMTP credentials
- Configure Twilio for production
- Set appropriate rate limits
- Enable logging and monitoring

### 2. Security Considerations
- Store credentials in secure environment variables
- Use HTTPS for all API endpoints
- Implement rate limiting for notification endpoints
- Validate all notification data

### 3. Performance Optimization
- Monitor notification queue size
- Adjust batch processing settings
- Set up database indexing
- Configure connection pooling

## API Reference

### Core Endpoints
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications/user` - Get user notifications
- `PUT /api/notifications/preferences` - Update preferences
- `GET /api/notifications/analytics` - View analytics
- `POST /api/notifications/bulk` - Send bulk notifications

### WebSocket Events
- `notification` - Real-time notification delivery
- `notification_read` - Mark notification as read
- `notification_updated` - Notification status change

## Support

For technical support or feature requests:
1. Check the troubleshooting section
2. Review server logs for errors
3. Test individual components (SMTP, Twilio, WebSocket)
4. Verify database schema and permissions

The notification engine is now ready to automate all CRM notifications across multiple channels!
