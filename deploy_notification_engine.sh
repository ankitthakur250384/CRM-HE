#!/bin/bash

# Notification Engine Deployment Script
# Run this script to deploy the notification engine to your ASP Cranes CRM

echo "🚀 ASP Cranes CRM - Notification Engine Deployment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}[STEP]${NC} $1"
    echo "----------------------------------------"
}

# Check if we're in the right directory
if [[ ! -f "crm-app/backend/package.json" ]]; then
    print_error "This script must be run from the asp-cranes-structured directory"
    print_error "Current directory: $(pwd)"
    exit 1
fi

print_step "1. Installing Required Packages"
cd crm-app/backend

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found in crm-app/backend"
    exit 1
fi

# Install required packages
print_status "Installing nodemailer, twilio, and ws packages..."
if npm install nodemailer twilio ws; then
    print_status "✅ Packages installed successfully"
else
    print_error "❌ Failed to install packages"
    exit 1
fi

cd ../..

print_step "2. Database Schema Setup"
print_status "Database schema file: enhanced_notifications_schema.sql"
print_warning "You need to manually run the database schema update:"
echo ""
echo "For PostgreSQL:"
echo "  psql -h localhost -d aspcranes -U your_username -f enhanced_notifications_schema.sql"
echo ""
echo "Or import the SQL file through your database management tool"
echo ""

print_step "3. Environment Configuration"
print_status "Creating sample environment configuration..."

# Create sample .env file if it doesn't exist
ENV_FILE="crm-app/backend/.env.sample"
if [[ ! -f "$ENV_FILE" ]]; then
    cat > "$ENV_FILE" << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/aspcranes

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=ASP Cranes CRM <your-email@gmail.com>

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Notification Engine Settings (Optional)
NOTIFICATION_BATCH_SIZE=50
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY=5000
SCHEDULED_PROCESSOR_INTERVAL=60000

# Server Configuration
PORT=3001
NODE_ENV=development
EOF
    print_status "✅ Created sample environment file: $ENV_FILE"
else
    print_status "Environment sample file already exists"
fi

print_step "4. Configuration Instructions"
print_warning "IMPORTANT: You must configure the following before starting the server:"
echo ""
echo "1. Copy .env.sample to .env and update with your credentials:"
echo "   cp crm-app/backend/.env.sample crm-app/backend/.env"
echo ""
echo "2. Configure email settings:"
echo "   - For Gmail: Enable 2FA and create an App Password"
echo "   - Update SMTP_USER and SMTP_PASS with your credentials"
echo ""
echo "3. Configure SMS settings (optional):"
echo "   - Create a Twilio account and get your credentials"
echo "   - Update TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER"
echo ""
echo "4. Run the database schema update"
echo ""

print_step "5. Verification Steps"
print_status "After configuration, verify the installation:"
echo ""
echo "1. Start the server:"
echo "   cd crm-app/backend && npm run dev"
echo ""
echo "2. Look for these messages in the console:"
echo "   - '🚀 API server running at http://localhost:3001'"
echo "   - '✅ Notification Engine initialized successfully'"
echo "   - '- WebSocket: ws://localhost:3001 (real-time notifications)'"
echo ""
echo "3. Test the notification API:"
echo "   curl -X GET http://localhost:3001/api/notifications/health"
echo ""

print_step "6. Feature Summary"
print_status "The notification engine provides:"
echo "• 📱 Real-time in-app notifications via WebSocket"
echo "• 📧 Email notifications via SMTP"
echo "• 📱 SMS notifications via Twilio"
echo "• 🔄 Automatic notifications for leads, jobs, and quotations"
echo "• ⚙️  User preference management"
echo "• 📊 Notification analytics and logging"
echo "• ⏰ Scheduled notification delivery"
echo "• 🎨 Customizable notification templates"
echo ""

print_step "7. Next Steps"
print_status "Complete setup checklist:"
echo "☐ Install packages (✅ Done)"
echo "☐ Run database schema update"
echo "☐ Configure environment variables"
echo "☐ Test email configuration"
echo "☐ Test SMS configuration (optional)"
echo "☐ Start the server and verify initialization"
echo "☐ Test notification functionality"
echo ""

print_status "📚 For detailed instructions, see: NOTIFICATION_ENGINE_SETUP.md"
print_status "🎉 Notification Engine deployment preparation complete!"

echo ""
echo "================================================="
echo "Next: Configure your .env file and run the database schema update"
echo "Then start the server with: cd crm-app/backend && npm run dev"
echo "================================================="
