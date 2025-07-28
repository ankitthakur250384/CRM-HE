#!/bin/bash

# Quick API Test Script for ASP Cranes CRM
# Tests basic CRUD operations using curl

echo "🧪 Quick API CRUD Test for ASP Cranes CRM"
echo "=========================================="
echo ""

API_BASE="http://localhost:3001/api"
TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test API health
echo -e "${BLUE}1. Testing API Health...${NC}"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "$API_BASE/health")
HTTP_CODE="${HEALTH_RESPONSE: -3}"
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ API Health Check: PASSED${NC}"
else
    echo -e "${RED}❌ API Health Check: FAILED (HTTP $HTTP_CODE)${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}2. Testing Customer CRUD...${NC}"

# Create Customer
echo "Creating test customer..."
CUSTOMER_DATA='{
    "name": "Test Customer API",
    "company_name": "Test Company Ltd",
    "contact_name": "John Doe",
    "email": "testapi@company.com",
    "phone": "+1-555-TEST",
    "address": "123 Test Street, Test City, TC 12345",
    "type": "construction",
    "designation": "Project Manager",
    "notes": "Test customer created via API test script"
}'

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/customers" \
    -H "Content-Type: application/json" \
    -d "$CUSTOMER_DATA")

CREATE_HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

if [ "$CREATE_HTTP_CODE" -eq 201 ] || [ "$CREATE_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Customer Creation: PASSED${NC}"
    CUSTOMER_ID=$(echo "$CREATE_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Customer ID: $CUSTOMER_ID"
else
    echo -e "${RED}❌ Customer Creation: FAILED (HTTP $CREATE_HTTP_CODE)${NC}"
    echo "Response: $CREATE_BODY"
fi

# List Customers
echo ""
echo "Fetching customer list..."
LIST_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/customers")
LIST_HTTP_CODE=$(echo "$LIST_RESPONSE" | tail -n1)

if [ "$LIST_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Customer List: PASSED${NC}"
    CUSTOMER_COUNT=$(echo "$LIST_RESPONSE" | head -n -1 | grep -o '"id":' | wc -l)
    echo "Found $CUSTOMER_COUNT customers"
else
    echo -e "${RED}❌ Customer List: FAILED (HTTP $LIST_HTTP_CODE)${NC}"
fi

# Get Specific Customer
if [ ! -z "$CUSTOMER_ID" ]; then
    echo ""
    echo "Fetching specific customer..."
    GET_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/customers/$CUSTOMER_ID")
    GET_HTTP_CODE=$(echo "$GET_RESPONSE" | tail -n1)
    
    if [ "$GET_HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ Customer Get: PASSED${NC}"
    else
        echo -e "${RED}❌ Customer Get: FAILED (HTTP $GET_HTTP_CODE)${NC}"
    fi
fi

# Update Customer
if [ ! -z "$CUSTOMER_ID" ]; then
    echo ""
    echo "Updating customer..."
    UPDATE_DATA='{"name": "Updated Test Customer API"}'
    UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_BASE/customers/$CUSTOMER_ID" \
        -H "Content-Type: application/json" \
        -d "$UPDATE_DATA")
    
    UPDATE_HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n1)
    
    if [ "$UPDATE_HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ Customer Update: PASSED${NC}"
    else
        echo -e "${RED}❌ Customer Update: FAILED (HTTP $UPDATE_HTTP_CODE)${NC}"
    fi
fi

echo ""
echo -e "${BLUE}3. Testing Lead CRUD...${NC}"

# Create Lead
echo "Creating test lead..."
LEAD_DATA='{
    "title": "Test Lead API",
    "company_name": "Test Lead Company",
    "contact_name": "Jane Smith",
    "email": "testlead@company.com",
    "phone": "+1-555-LEAD",
    "equipment_type": "crane",
    "project_details": "Test project for API verification",
    "budget_range": "50000-100000",
    "timeline": "2024-03-01",
    "source": "website",
    "status": "new",
    "priority": "medium"
}'

LEAD_CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/leads" \
    -H "Content-Type: application/json" \
    -d "$LEAD_DATA")

LEAD_CREATE_HTTP_CODE=$(echo "$LEAD_CREATE_RESPONSE" | tail -n1)
LEAD_CREATE_BODY=$(echo "$LEAD_CREATE_RESPONSE" | head -n -1)

if [ "$LEAD_CREATE_HTTP_CODE" -eq 201 ] || [ "$LEAD_CREATE_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Lead Creation: PASSED${NC}"
    LEAD_ID=$(echo "$LEAD_CREATE_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Lead ID: $LEAD_ID"
elif [ "$LEAD_CREATE_HTTP_CODE" -eq 401 ]; then
    echo -e "${YELLOW}⚠️ Lead Creation: AUTHENTICATION REQUIRED${NC}"
else
    echo -e "${RED}❌ Lead Creation: FAILED (HTTP $LEAD_CREATE_HTTP_CODE)${NC}"
    echo "Response: $LEAD_CREATE_BODY"
fi

# List Leads
echo ""
echo "Fetching lead list..."
LEAD_LIST_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/leads")
LEAD_LIST_HTTP_CODE=$(echo "$LEAD_LIST_RESPONSE" | tail -n1)

if [ "$LEAD_LIST_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Lead List: PASSED${NC}"
elif [ "$LEAD_LIST_HTTP_CODE" -eq 401 ]; then
    echo -e "${YELLOW}⚠️ Lead List: AUTHENTICATION REQUIRED${NC}"
else
    echo -e "${RED}❌ Lead List: FAILED (HTTP $LEAD_LIST_HTTP_CODE)${NC}"
fi

echo ""
echo -e "${BLUE}4. Testing Authentication...${NC}"

# Test user registration
echo "Testing user registration..."
USER_DATA='{
    "email": "testapi@aspcranes.com",
    "password": "testpass123",
    "display_name": "API Test User",
    "role": "sales_agent"
}'

REG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "$USER_DATA")

REG_HTTP_CODE=$(echo "$REG_RESPONSE" | tail -n1)

if [ "$REG_HTTP_CODE" -eq 201 ] || [ "$REG_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ User Registration: PASSED${NC}"
elif [ "$REG_HTTP_CODE" -eq 409 ]; then
    echo -e "${YELLOW}⚠️ User Registration: USER ALREADY EXISTS${NC}"
else
    echo -e "${RED}❌ User Registration: FAILED (HTTP $REG_HTTP_CODE)${NC}"
fi

# Test user login
echo ""
echo "Testing user login..."
LOGIN_DATA='{
    "email": "testapi@aspcranes.com",
    "password": "testpass123"
}'

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

LOGIN_HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$LOGIN_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ User Login: PASSED${NC}"
    TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$TOKEN" ]; then
        echo "Token received: ${TOKEN:0:20}..."
    fi
else
    echo -e "${RED}❌ User Login: FAILED (HTTP $LOGIN_HTTP_CODE)${NC}"
    echo "Response: $LOGIN_BODY"
fi

echo ""
echo -e "${BLUE}5. Testing Equipment Endpoints...${NC}"

# Test equipment list
EQUIPMENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/equipment")
EQUIPMENT_HTTP_CODE=$(echo "$EQUIPMENT_RESPONSE" | tail -n1)

if [ "$EQUIPMENT_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Equipment List: PASSED${NC}"
elif [ "$EQUIPMENT_HTTP_CODE" -eq 401 ]; then
    echo -e "${YELLOW}⚠️ Equipment List: AUTHENTICATION REQUIRED${NC}"
else
    echo -e "${RED}❌ Equipment List: FAILED (HTTP $EQUIPMENT_HTTP_CODE)${NC}"
fi

echo ""
echo -e "${BLUE}6. Cleanup Test Data...${NC}"

# Delete test customer
if [ ! -z "$CUSTOMER_ID" ]; then
    echo "Deleting test customer..."
    DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/customers/$CUSTOMER_ID")
    DELETE_HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
    
    if [ "$DELETE_HTTP_CODE" -eq 200 ] || [ "$DELETE_HTTP_CODE" -eq 204 ]; then
        echo -e "${GREEN}✅ Customer Deletion: PASSED${NC}"
    else
        echo -e "${RED}❌ Customer Deletion: FAILED (HTTP $DELETE_HTTP_CODE)${NC}"
    fi
fi

# Delete test lead
if [ ! -z "$LEAD_ID" ]; then
    echo "Deleting test lead..."
    if [ ! -z "$TOKEN" ]; then
        LEAD_DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/leads/$LEAD_ID" \
            -H "Authorization: Bearer $TOKEN")
    else
        LEAD_DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/leads/$LEAD_ID")
    fi
    
    LEAD_DELETE_HTTP_CODE=$(echo "$LEAD_DELETE_RESPONSE" | tail -n1)
    
    if [ "$LEAD_DELETE_HTTP_CODE" -eq 200 ] || [ "$LEAD_DELETE_HTTP_CODE" -eq 204 ]; then
        echo -e "${GREEN}✅ Lead Deletion: PASSED${NC}"
    else
        echo -e "${YELLOW}⚠️ Lead Deletion: May require authentication (HTTP $LEAD_DELETE_HTTP_CODE)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 API Tests Completed!${NC}"
echo ""
echo -e "${BLUE}📝 Summary:${NC}"
echo "- API Health: Tested"
echo "- Customer CRUD: Tested" 
echo "- Lead CRUD: Tested"
echo "- Authentication: Tested"
echo "- Equipment: Tested"
echo "- Cleanup: Attempted"
echo ""
echo -e "${BLUE}💡 Note:${NC} Some endpoints may require authentication (HTTP 401)"
echo "This is expected behavior for secured endpoints."
