# Firestore to PostgreSQL Migration Tools

This directory contains scripts to migrate data from Firestore to PostgreSQL.

## Features

- Automatically extracts all fields from Firestore documents
- Dynamically creates tables and columns based on document structure
- Flattens nested objects using dot notation
- Handles arrays by converting them to JSON strings
- Prevents duplicate entries using `ON CONFLICT DO NOTHING`
- Automatically maps JavaScript types to appropriate PostgreSQL data types

## Prerequisites

1. You need a Firebase service account key file for authentication
2. PostgreSQL connection details should be configured in your `.env` file

## Setup

1. Place your Firebase service account key file in a secure location and set its path:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/your/serviceAccountKey.json
```

2. Configure PostgreSQL connection in your `.env` file:

```env
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=asp_crm
VITE_DB_USER=postgres
VITE_DB_PASSWORD=your_password
VITE_DB_SSL=false
```

## Available Migration Scripts

### 1. Users Migration (Fixed Collection)

Migrates the "users" collection to a "users" PostgreSQL table:

```bash
npm run migrate:firestore-users
```

### 2. Generic Collection Migration

Migrates any Firestore collection to PostgreSQL:

```bash
# Syntax: npm run migrate:firestore <collection-name> [table-name]
npm run migrate:firestore customers
npm run migrate:firestore orders custom_orders
```

If the table name is omitted, it will use the same name as the collection.

## How It Works

1. The script connects to both Firestore and PostgreSQL
2. It fetches all documents from the specified collection in Firestore
3. Using the first document, it creates a PostgreSQL table with appropriate columns
4. For each subsequent document, it adds any missing columns to the table
5. It then inserts each document into the PostgreSQL table
6. Both connections are properly closed when migration is complete

## Type Mapping

The scripts automatically map JavaScript/Firestore types to PostgreSQL types:

| JavaScript/Firestore Type | PostgreSQL Type |
|--------------------------|-----------------|
| String                   | TEXT            |
| Integer Number           | INTEGER         |
| Float Number             | NUMERIC         |
| Boolean                  | BOOLEAN         |
| Date/Timestamp           | TIMESTAMP       |
| Array                    | TEXT (JSON)     |
| Object (nested)          | Flattened fields |

## Error Handling

- The scripts include error handling for both individual documents and the overall migration
- Documents that fail to migrate are logged but don't stop the process
- A summary of successful and failed migrations is provided at the end
