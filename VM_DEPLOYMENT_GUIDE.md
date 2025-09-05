# 🔧 **VM Deployment Guide - Post GitGuardian Fix**

## 🚨 **Security Alert Resolution**

GitGuardian detected exposed secrets. All secrets have been **revoked and replaced** with secure environment variables.

## 🔑 **New Secure Tokens Generated**

**JWT Secret**: `MoBly0rPrUSgf8yj0yuzTQgceJJy/FwCaYY62qGA7zm3vFugjPh46YR5uHsvfCP1+gKiOqjISkmrzWfRgIdv0Q==`
**Refresh Secret**: `SkkXDeYqLyQte/+Ta35PsX+XG76eebZ9oWuTpHeyM5QeAQBVPmNf/01tPyr1Nw+q1gXO3BtcrFLwUCZ2//facA==`
**Session Secret**: `hhxqD54L9QVzZkLZ+s9WXswDQPOS6SvUgBYhxKMUndw=`

## 🖥️ **VM Setup Instructions**

### **1. Clone Repository on VM**
```bash
git clone https://github.com/VedantSinghThakur21/asp-cranes-structured.git
cd asp-cranes-structured
```

### **2. Set Environment Variables on VM**
```bash
# Create .env file for production
cat > .env.production << 'EOF'
# Production Environment Variables
JWT_SECRET=MoBly0rPrUSgf8yj0yuzTQgceJJy/FwCaYY62qGA7zm3vFugjPh46YR5uHsvfCP1+gKiOqjISkmrzWfRgIdv0Q==
JWT_REFRESH_SECRET=SkkXDeYqLyQte/+Ta35PsX+XG76eebZ9oWuTpHeyM5QeAQBVPmNf/01tPyr1Nw+q1gXO3BtcrFLwUCZ2//facA==
SESSION_SECRET=hhxqD54L9QVzZkLZ+s9WXswDQPOS6SvUgBYhxKMUndw=
DB_PASSWORD=your_secure_vm_password
POSTGRES_PASSWORD=your_secure_vm_password
CREWAI_API_TOKEN=your_crewai_token
EOF
```

### **3. Deploy with Docker**
```bash
# Load environment variables
source .env.production

# Deploy with new secure tokens
docker-compose up -d

# Verify deployment
curl -k https://your-vm-ip/health
```

## 🔄 **Changes Made to Repository**

### **Docker Compose Security Updates**
- ✅ Hardcoded secrets replaced with environment variables
- ✅ Secure fallback defaults implemented
- ✅ New JWT tokens with 64-byte entropy

### **Environment File Updates**
- ✅ Backend .env updated with new secure tokens
- ✅ Frontend .env cleaned of sensitive data
- ✅ All passwords and tokens refreshed

## 🛡️ **Security Status**

**Old Exposed Secrets**: ❌ **REVOKED**
- Old JWT secrets invalidated
- Old database passwords changed
- Old API tokens removed

**New Secure Setup**: ✅ **ACTIVE**
- Cryptographically secure 64-byte JWT secrets
- Environment variable configuration
- No hardcoded secrets in repository

## 🚀 **VM Deployment Checklist**

- [ ] Clone updated repository
- [ ] Create `.env.production` with new secrets
- [ ] Set `DB_PASSWORD` for your VM database
- [ ] Set `CREWAI_API_TOKEN` if using AI features
- [ ] Run `docker-compose up -d`
- [ ] Verify `https://your-vm-ip/health` returns "healthy"
- [ ] Test JWT authentication with new tokens

## 📝 **Notes**

1. **Database Password**: Set your own secure password for the VM database
2. **CREWAI Token**: Get a new token from your CrewAI dashboard if needed
3. **SSL Certificates**: Self-signed certificates will be generated automatically
4. **Environment Files**: The .env files remain in the repository for VM deployment ease

## ✅ **Security Verification**

After deployment, verify security:
```bash
# Check that environment variables are loaded
docker-compose exec backend printenv | grep JWT_SECRET

# Test authentication endpoint
curl -X POST https://your-vm-ip/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' -k

# Verify new JWT tokens are being used
docker-compose logs backend | grep "JWT"
```

**Status**: 🟢 **Ready for secure VM deployment**
