#!/bin/bash

# Comprehensive Database and API Verification Script for ASP Cranes CRM
# Run this script on your deployed server to verify all connections and operations

echo "🚀 ASP Cranes CRM - Database and API Verification Script"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found. Please run this script from the project root directory.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Checking Docker containers...${NC}"
echo ""

# Check if containers are running
CONTAINERS_RUNNING=$(docker-compose ps --services --filter "status=running" | wc -l)
TOTAL_SERVICES=$(docker-compose config --services | wc -l)

echo "Running containers: $CONTAINERS_RUNNING / $TOTAL_SERVICES"

if [ "$CONTAINERS_RUNNING" -ne "$TOTAL_SERVICES" ]; then
    echo -e "${YELLOW}⚠️ Not all containers are running. Starting containers...${NC}"
    docker-compose up -d
    sleep 10
    echo "Waiting for containers to be healthy..."
    sleep 30
else
    echo -e "${GREEN}✅ All containers are running${NC}"
fi

# Show container status
echo ""
echo "Container status:"
docker-compose ps

echo ""
echo -e "${BLUE}📋 Step 2: Checking database tables and structure...${NC}"
echo ""

# Check if postgres container is running
POSTGRES_RUNNING=$(docker-compose ps postgres | grep "Up" | wc -l)

if [ "$POSTGRES_RUNNING" -eq 1 ]; then
    echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
    
    # List all tables
    echo ""
    echo "Database tables:"
    docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "\dt" 2>/dev/null
    
    # Check table row counts
    echo ""
    echo "Table row counts:"
    docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_rows
        FROM pg_stat_user_tables 
        ORDER BY tablename;
    " 2>/dev/null
    
else
    echo -e "${RED}❌ PostgreSQL container is not running${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 3: Testing database connections directly...${NC}"
echo ""

# Run database verification script
if [ -f "verify-database-connections.js" ]; then
    echo "Running direct database connection tests..."
    docker exec -it asp-cranes-structured-backend-1 node /app/verify-database-connections.js 2>/dev/null || {
        echo -e "${YELLOW}⚠️ Direct database test failed. File may not be in container.${NC}"
    }
else
    echo -e "${YELLOW}⚠️ verify-database-connections.js not found${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 4: Testing API endpoints...${NC}"
echo ""

# Check if backend is responding
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)

if [ "$BACKEND_HEALTH" -eq 200 ]; then
    echo -e "${GREEN}✅ Backend API is responding${NC}"
    
    # Test API info endpoint
    echo ""
    echo "API Information:"
    curl -s http://localhost:3001/api | jq '.' 2>/dev/null || curl -s http://localhost:3001/api
    
    echo ""
    echo "Testing specific endpoints:"
    
    # Test customer endpoint
    CUSTOMER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/customers)
    if [ "$CUSTOMER_STATUS" -eq 200 ] || [ "$CUSTOMER_STATUS" -eq 401 ]; then
        echo -e "${GREEN}✅ Customer endpoint accessible (HTTP $CUSTOMER_STATUS)${NC}"
    else
        echo -e "${RED}❌ Customer endpoint failed (HTTP $CUSTOMER_STATUS)${NC}"
    fi
    
    # Test leads endpoint
    LEADS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/leads)
    if [ "$LEADS_STATUS" -eq 200 ] || [ "$LEADS_STATUS" -eq 401 ]; then
        echo -e "${GREEN}✅ Leads endpoint accessible (HTTP $LEADS_STATUS)${NC}"
    else
        echo -e "${RED}❌ Leads endpoint failed (HTTP $LEADS_STATUS)${NC}"
    fi
    
    # Test deals endpoint
    DEALS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/deals)
    if [ "$DEALS_STATUS" -eq 200 ] || [ "$DEALS_STATUS" -eq 401 ]; then
        echo -e "${GREEN}✅ Deals endpoint accessible (HTTP $DEALS_STATUS)${NC}"
    else
        echo -e "${RED}❌ Deals endpoint failed (HTTP $DEALS_STATUS)${NC}"
    fi
    
    # Test users endpoint
    USERS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/users)
    if [ "$USERS_STATUS" -eq 200 ] || [ "$USERS_STATUS" -eq 401 ]; then
        echo -e "${GREEN}✅ Users endpoint accessible (HTTP $USERS_STATUS)${NC}"
    else
        echo -e "${RED}❌ Users endpoint failed (HTTP $USERS_STATUS)${NC}"
    fi
    
    # Test equipment endpoint
    EQUIPMENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/equipment)
    if [ "$EQUIPMENT_STATUS" -eq 200 ] || [ "$EQUIPMENT_STATUS" -eq 401 ]; then
        echo -e "${GREEN}✅ Equipment endpoint accessible (HTTP $EQUIPMENT_STATUS)${NC}"
    else
        echo -e "${RED}❌ Equipment endpoint failed (HTTP $EQUIPMENT_STATUS)${NC}"
    fi
    
else
    echo -e "${RED}❌ Backend API is not responding (HTTP $BACKEND_HEALTH)${NC}"
    echo "Backend logs:"
    docker-compose logs --tail=20 backend
fi

echo ""
echo -e "${BLUE}📋 Step 5: Testing frontend...${NC}"
echo ""

# Check if frontend is responding
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$FRONTEND_HEALTH" -eq 200 ]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is not accessible (HTTP $FRONTEND_HEALTH)${NC}"
    echo "Frontend logs:"
    docker-compose logs --tail=20 frontend
fi

echo ""
echo -e "${BLUE}📋 Step 6: Running comprehensive API tests...${NC}"
echo ""

# Run API verification script
if [ -f "verify-api-endpoints.js" ]; then
    echo "Running comprehensive API endpoint tests..."
    docker exec -it asp-cranes-structured-backend-1 node /app/verify-api-endpoints.js 2>/dev/null || {
        echo -e "${YELLOW}⚠️ Comprehensive API test failed. File may not be in container.${NC}"
        echo "Attempting to run locally..."
        if command -v node &> /dev/null; then
            node verify-api-endpoints.js
        else
            echo -e "${YELLOW}⚠️ Node.js not found on host system${NC}"
        fi
    }
else
    echo -e "${YELLOW}⚠️ verify-api-endpoints.js not found${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 7: Configuration verification...${NC}"
echo ""

# Check environment variables
echo "Backend environment configuration:"
docker exec asp-cranes-structured-backend-1 printenv | grep -E "DB_|NODE_|PORT|JWT_" | sort

echo ""
echo "Database connection configuration:"
docker exec asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "
    SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version;
" 2>/dev/null

echo ""
echo -e "${BLUE}📋 Step 8: Performance and resource check...${NC}"
echo ""

# Check container resources
echo "Container resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

echo ""
echo "Disk usage:"
docker system df

echo ""
echo -e "${GREEN}🎉 Verification completed!${NC}"
echo ""
echo -e "${BLUE}📝 Summary Report:${NC}"
echo "==================="

# Generate summary
if [ "$CONTAINERS_RUNNING" -eq "$TOTAL_SERVICES" ]; then
    echo -e "Docker Containers: ${GREEN}✅ All running${NC}"
else
    echo -e "Docker Containers: ${YELLOW}⚠️ Some issues${NC}"
fi

if [ "$POSTGRES_RUNNING" -eq 1 ]; then
    echo -e "PostgreSQL Database: ${GREEN}✅ Running${NC}"
else
    echo -e "PostgreSQL Database: ${RED}❌ Not running${NC}"
fi

if [ "$BACKEND_HEALTH" -eq 200 ]; then
    echo -e "Backend API: ${GREEN}✅ Accessible${NC}"
else
    echo -e "Backend API: ${RED}❌ Issues detected${NC}"
fi

if [ "$FRONTEND_HEALTH" -eq 200 ]; then
    echo -e "Frontend: ${GREEN}✅ Accessible${NC}"
else
    echo -e "Frontend: ${RED}❌ Issues detected${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Access URLs:${NC}"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001/api"
echo "API Health: http://localhost:3001/api/health"
echo ""

# Final recommendations
echo -e "${BLUE}💡 Recommendations:${NC}"
if [ "$BACKEND_HEALTH" -ne 200 ]; then
    echo "- Check backend logs: docker-compose logs backend"
    echo "- Verify database connection settings"
    echo "- Ensure all environment variables are set correctly"
fi

if [ "$FRONTEND_HEALTH" -ne 200 ]; then
    echo "- Check frontend logs: docker-compose logs frontend"
    echo "- Verify frontend build was successful"
fi

if [ "$POSTGRES_RUNNING" -ne 1 ]; then
    echo "- Check PostgreSQL logs: docker-compose logs postgres"
    echo "- Verify database credentials and configuration"
fi

echo ""
echo -e "${GREEN}Script completed at: $(date)${NC}"
