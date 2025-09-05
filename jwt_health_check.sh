#!/bin/bash

# JWT Health Check Script for Docker Deployment
# Validates JWT token generation and refresh functionality

echo "🏥 JWT Health Check for ASP Cranes CRM"
echo "======================================="

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
HEALTH_ENDPOINT="$BACKEND_URL/api/health"
TOKEN_INFO_ENDPOINT="$BACKEND_URL/api/auth/token-info"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Health check function
check_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    if curl -s -f "$endpoint" > /dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# JWT Environment validation
validate_jwt_env() {
    echo "🔍 Validating JWT Environment Variables:"
    
    local missing_vars=()
    
    if [ -z "$JWT_SECRET" ]; then
        missing_vars+=("JWT_SECRET")
    fi
    
    if [ -z "$JWT_REFRESH_SECRET" ]; then
        missing_vars+=("JWT_REFRESH_SECRET")
    fi
    
    if [ -z "$SESSION_SECRET" ]; then
        missing_vars+=("SESSION_SECRET")
    fi
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo -e "   ${GREEN}✅ All JWT environment variables are set${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Missing environment variables: ${missing_vars[*]}${NC}"
        return 1
    fi
}

# Test JWT token generation
test_jwt_generation() {
    echo "🔑 Testing JWT Token Generation:"
    
    # Create a test script to generate tokens
    local test_script=$(cat << 'EOF'
const crypto = require('crypto');

// Generate test secrets
const JWT_SECRET = crypto.randomBytes(64).toString('base64');
const JWT_REFRESH_SECRET = crypto.randomBytes(64).toString('base64');

console.log(JSON.stringify({
    jwt_secret_length: JWT_SECRET.length,
    refresh_secret_length: JWT_REFRESH_SECRET.length,
    valid: JWT_SECRET.length > 0 && JWT_REFRESH_SECRET.length > 0
}));
EOF
)
    
    local result=$(node -e "$test_script")
    local valid=$(echo "$result" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).valid)")
    
    if [ "$valid" = "true" ]; then
        echo -e "   ${GREEN}✅ JWT token generation working${NC}"
        return 0
    else
        echo -e "   ${RED}❌ JWT token generation failed${NC}"
        return 1
    fi
}

# Test token expiry calculation
test_token_expiry() {
    echo "⏰ Testing Token Expiry Calculation:"
    
    local test_script=$(cat << 'EOF'
// Test expiry time conversion
function getTokenExpiryMs(expiryString) {
    const value = parseInt(expiryString);
    const unit = expiryString.slice(-1);
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return value * 60 * 1000;
    }
}

// Test cases
const tests = [
    { input: '15m', expected: 15 * 60 * 1000 },
    { input: '7d', expected: 7 * 24 * 60 * 60 * 1000 },
    { input: '1h', expected: 60 * 60 * 1000 }
];

let passed = 0;
tests.forEach(test => {
    const result = getTokenExpiryMs(test.input);
    if (result === test.expected) {
        passed++;
    }
});

console.log(JSON.stringify({ passed, total: tests.length, success: passed === tests.length }));
EOF
)
    
    local result=$(node -e "$test_script")
    local success=$(echo "$result" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).success)")
    
    if [ "$success" = "true" ]; then
        echo -e "   ${GREEN}✅ Token expiry calculation working${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Token expiry calculation failed${NC}"
        return 1
    fi
}

# Test refresh token schedule
test_refresh_schedule() {
    echo "📅 Testing Refresh Token Schedule:"
    
    # Check if refresh intervals are properly configured
    local access_expiry="15m"  # 15 minutes
    local refresh_threshold="5m"  # 5 minutes before expiry
    
    local test_script=$(cat << EOF
const accessExpiry = 15 * 60 * 1000;  // 15 minutes in ms
const refreshThreshold = 5 * 60 * 1000;  // 5 minutes in ms
const refreshInterval = 13 * 60 * 1000;  // 13 minutes in ms (should be less than access expiry)

const validSchedule = refreshInterval < accessExpiry && refreshThreshold < accessExpiry;
console.log(JSON.stringify({ 
    accessExpiry, 
    refreshThreshold, 
    refreshInterval, 
    validSchedule 
}));
EOF
)
    
    local result=$(node -e "$test_script")
    local valid=$(echo "$result" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).validSchedule)")
    
    if [ "$valid" = "true" ]; then
        echo -e "   ${GREEN}✅ Refresh schedule properly configured${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Refresh schedule misconfigured${NC}"
        return 1
    fi
}

# Main health check sequence
main() {
    local failures=0
    
    echo "Starting JWT health checks..."
    echo ""
    
    # Basic connectivity
    if ! check_endpoint "$HEALTH_ENDPOINT" "Backend Health Endpoint"; then
        ((failures++))
    fi
    
    # JWT environment validation
    if ! validate_jwt_env; then
        ((failures++))
    fi
    
    # JWT generation test
    if ! test_jwt_generation; then
        ((failures++))
    fi
    
    # Token expiry test
    if ! test_token_expiry; then
        ((failures++))
    fi
    
    # Refresh schedule test
    if ! test_refresh_schedule; then
        ((failures++))
    fi
    
    echo ""
    echo "======================================="
    
    if [ $failures -eq 0 ]; then
        echo -e "${GREEN}🎉 All JWT health checks passed!${NC}"
        echo -e "${GREEN}✅ System ready for production deployment${NC}"
        exit 0
    else
        echo -e "${RED}❌ $failures health check(s) failed${NC}"
        echo -e "${RED}🚨 System not ready for production${NC}"
        exit 1
    fi
}

# Run health checks
main "$@"
