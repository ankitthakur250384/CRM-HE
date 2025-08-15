#!/bin/bash

echo "=== Testing Template API ==="
echo "1. Testing direct API call to backend..."

curl -v http://103.224.243.242:3001/api/templates

echo ""
echo "2. Testing API health..."

curl -v http://103.224.243.242:3001/api/health

echo ""
echo "=== Test Complete ==="
