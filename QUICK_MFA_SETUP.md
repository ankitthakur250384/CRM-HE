# Quick MFA Setup Commands for Ubuntu

## 1. Run MFA Database Setup (Manual)
```bash
# Setup MFA database schema directly
docker-compose exec -T postgres psql -U postgres -d asp_crm < setup_mfa_database.sql
```

## 2. Check Database Tables
```bash
# Verify MFA tables were created
docker-compose exec postgres psql -U postgres -d asp_crm -c "\dt"
```

## 3. Check MFA Columns in Users Table
```bash
# Verify MFA columns added to users table
docker-compose exec postgres psql -U postgres -d asp_crm -c "\d users"
```

## 4. Restart Backend with Fixed Imports
```bash
# Restart backend to apply import fixes
docker-compose restart backend
```

## 5. Check Backend Logs
```bash
# Monitor backend startup
docker-compose logs -f backend
```

## 6. Test MFA Endpoint
```bash
# Test that MFA endpoint is available (requires authentication)
curl -X GET http://localhost:3001/api/mfa/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Backend Issues Fix:
- ✅ Fixed duplicate aiRoutes import
- ✅ Created mfaRoutes.mjs from TypeScript
- ✅ Fixed all import paths (.ts → .mjs)
- ✅ MFA database schema ready
- ✅ Docker service names corrected (db → postgres)
- ✅ Database name corrected (aspcranes_crm → asp_crm)
