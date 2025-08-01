#!/bin/bash

# Test script for ASP Cranes CRM Configuration API Endpoints
# This script tests all the configuration endpoints that were failing with 500 errors

API_BASE="http://103.224.243.242:3000"

echo "🧪 Testing ASP Cranes CRM Configuration API Endpoints"
echo "========================================================="

# Test quotation config
echo "📋 Testing GET /api/config/quotation"
curl -s -X GET "${API_BASE}/api/config/quotation" | jq '.' || echo "❌ Failed to fetch quotation config"
echo ""

# Test resourceRates config
echo "📋 Testing GET /api/config/resourceRates"
curl -s -X GET "${API_BASE}/api/config/resourceRates" | jq '.' || echo "❌ Failed to fetch resourceRates config"
echo ""

# Test additionalParams config
echo "📋 Testing GET /api/config/additionalParams"
curl -s -X GET "${API_BASE}/api/config/additionalParams" | jq '.' || echo "❌ Failed to fetch additionalParams config"
echo ""

# Test dbconfig
echo "📋 Testing GET /api/dbconfig"
curl -s -X GET "${API_BASE}/api/dbconfig" | jq '.' || echo "❌ Failed to fetch dbconfig"
echo ""

# Test all configs at once
echo "📋 Testing GET /api/config (all configs)"
curl -s -X GET "${API_BASE}/api/config" | jq '.' || echo "❌ Failed to fetch all configs"
echo ""

# Test health endpoint
echo "🏥 Testing GET /api/health"
curl -s -X GET "${API_BASE}/api/health" | jq '.' || echo "❌ Failed to fetch health status"
echo ""

echo "✅ Test completed!"
echo ""
echo "💡 If any endpoints fail:"
echo "   1. Check if the backend server is running"
echo "   2. Verify database connection"
echo "   3. Run the insert_missing_configs.sql script"
echo "   4. Check server logs for errors"
