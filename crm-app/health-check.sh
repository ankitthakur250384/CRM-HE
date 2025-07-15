#!/bin/bash

# Health Check and Monitoring Script
# This script monitors the health of all CRM services

set -e

DEPLOY_PATH="/opt/crm-app"
LOG_FILE="/var/log/crm-health.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

check_service() {
    local service_name=$1
    local health_url=$2
    
    if curl -f -s $health_url > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is healthy${NC}"
        log_message "SUCCESS: $service_name is healthy"
        return 0
    else
        echo -e "${RED}❌ $service_name is unhealthy${NC}"
        log_message "ERROR: $service_name is unhealthy"
        return 1
    fi
}

check_docker_service() {
    local service_name=$1
    
    cd $DEPLOY_PATH
    if docker-compose ps $service_name | grep -q "Up"; then
        echo -e "${GREEN}✅ Docker service $service_name is running${NC}"
        log_message "SUCCESS: Docker service $service_name is running"
        return 0
    else
        echo -e "${RED}❌ Docker service $service_name is not running${NC}"
        log_message "ERROR: Docker service $service_name is not running"
        return 1
    fi
}

check_database_connection() {
    cd $DEPLOY_PATH
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection is healthy${NC}"
        log_message "SUCCESS: Database connection is healthy"
        return 0
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        log_message "ERROR: Database connection failed"
        return 1
    fi
}

check_disk_space() {
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ $usage -lt 80 ]; then
        echo -e "${GREEN}✅ Disk space is healthy ($usage% used)${NC}"
        log_message "SUCCESS: Disk space is healthy ($usage% used)"
        return 0
    elif [ $usage -lt 90 ]; then
        echo -e "${YELLOW}⚠️ Disk space warning ($usage% used)${NC}"
        log_message "WARNING: Disk space warning ($usage% used)"
        return 1
    else
        echo -e "${RED}❌ Disk space critical ($usage% used)${NC}"
        log_message "ERROR: Disk space critical ($usage% used)"
        return 1
    fi
}

check_memory_usage() {
    local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    
    if [ $memory_usage -lt 80 ]; then
        echo -e "${GREEN}✅ Memory usage is healthy ($memory_usage% used)${NC}"
        log_message "SUCCESS: Memory usage is healthy ($memory_usage% used)"
        return 0
    elif [ $memory_usage -lt 90 ]; then
        echo -e "${YELLOW}⚠️ Memory usage warning ($memory_usage% used)${NC}"
        log_message "WARNING: Memory usage warning ($memory_usage% used)"
        return 1
    else
        echo -e "${RED}❌ Memory usage critical ($memory_usage% used)${NC}"
        log_message "ERROR: Memory usage critical ($memory_usage% used)"
        return 1
    fi
}

restart_service() {
    local service_name=$1
    
    echo -e "${YELLOW}🔄 Restarting $service_name...${NC}"
    log_message "INFO: Restarting $service_name"
    
    cd $DEPLOY_PATH
    docker-compose restart $service_name
    
    sleep 10
    
    if check_docker_service $service_name; then
        echo -e "${GREEN}✅ $service_name restarted successfully${NC}"
        log_message "SUCCESS: $service_name restarted successfully"
        return 0
    else
        echo -e "${RED}❌ Failed to restart $service_name${NC}"
        log_message "ERROR: Failed to restart $service_name"
        return 1
    fi
}

send_alert() {
    local message=$1
    
    # Send email alert (configure with your email settings)
    # echo "$message" | mail -s "CRM System Alert" admin@yourdomain.com
    
    # Send Slack notification (configure with your Slack webhook)
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$message\"}" \
    #   YOUR_SLACK_WEBHOOK_URL
    
    log_message "ALERT: $message"
}

main() {
    echo "🔍 CRM Health Check - $(date)"
    echo "================================="
    
    local failed_checks=0
    
    # Check Docker services
    echo "🐳 Checking Docker services..."
    if ! check_docker_service "postgres"; then
        ((failed_checks++))
        if restart_service "postgres"; then
            ((failed_checks--))
        fi
    fi
    
    if ! check_docker_service "backend"; then
        ((failed_checks++))
        if restart_service "backend"; then
            ((failed_checks--))
        fi
    fi
    
    if ! check_docker_service "frontend"; then
        ((failed_checks++))
        if restart_service "frontend"; then
            ((failed_checks--))
        fi
    fi
    
    # Check database connection
    echo "🗄️ Checking database connection..."
    if ! check_database_connection; then
        ((failed_checks++))
    fi
    
    # Check service health endpoints
    echo "🌐 Checking service health endpoints..."
    if ! check_service "Backend API" "http://localhost:3001/health"; then
        ((failed_checks++))
    fi
    
    if ! check_service "Frontend" "http://localhost:3000"; then
        ((failed_checks++))
    fi
    
    # Check system resources
    echo "💻 Checking system resources..."
    if ! check_disk_space; then
        ((failed_checks++))
    fi
    
    if ! check_memory_usage; then
        ((failed_checks++))
    fi
    
    # Summary
    echo "================================="
    if [ $failed_checks -eq 0 ]; then
        echo -e "${GREEN}✅ All checks passed! System is healthy.${NC}"
        log_message "SUCCESS: All health checks passed"
    else
        echo -e "${RED}❌ $failed_checks check(s) failed. System needs attention.${NC}"
        log_message "ERROR: $failed_checks health checks failed"
        send_alert "CRM System Health Check Failed: $failed_checks issues detected"
    fi
    
    echo "📊 For detailed logs, check: $LOG_FILE"
    
    exit $failed_checks
}

# Run main function
main "$@"
