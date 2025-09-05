# Check Database Structure Commands

## 1. Check current database name
```bash
docker-compose exec postgres psql -U postgres -l
```

## 2. Check users table structure
```bash
docker-compose exec postgres psql -U postgres -d asp_crm -c "\d users"
```

## 3. Check all tables in asp_crm database
```bash
docker-compose exec postgres psql -U postgres -d asp_crm -c "\dt"
```

## 4. Show users table columns
```bash
docker-compose exec postgres psql -U postgres -d asp_crm -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users';"
```
