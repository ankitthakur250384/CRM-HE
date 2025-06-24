# Database Configuration Feature Documentation

## Overview

The Database Configuration feature allows administrators to view, edit, and test PostgreSQL database connection settings directly from the frontend. This feature is critical for system setup and troubleshooting database connectivity issues without requiring direct server access or manual configuration file edits.

## Components

### Frontend

#### `DatabaseConfig.tsx` Component

Located at: `src/components/config/DatabaseConfig.tsx`

This React component provides:
- A form for editing database connection parameters
- A "Test Connection" function to validate settings before saving
- A "Save Configuration" function to persist changes
- Toast notifications for user feedback

The component displays the following fields:
- Host
- Port
- Database Name
- Username
- Password
- SSL/TLS toggle

#### Integration in `Config.tsx`

The Database Configuration component is integrated into the main Configuration page under a collapsible card with a database icon, making it easily accessible to administrators.

### Backend

#### API Routes (`databaseRoutes.mjs`)

Located at: `src/api/databaseRoutes.mjs`

Exposes the following endpoints:

1. `GET /api/database/config`
   - Returns the current database configuration (omitting the password)
   - Protected: Admin access only

2. `PUT /api/database/config`
   - Updates the database configuration
   - Requires host, port, database, and user fields
   - Protected: Admin access only

3. `POST /api/database/test-connection`
   - Tests a database connection with the provided parameters
   - Returns connection status and timestamp if successful
   - Protected: Admin access only

#### Service (`configService.ts`)

Located at: `src/services/configService.ts`

Provides:
- `getConfig('database')` - Retrieves database configuration
- `updateConfig('database', data)` - Updates database configuration

#### Repository (`configRepository.ts`)

Located at: `src/services/postgres/configRepository.ts`

Handles:
- `getDatabaseConfig()` - Fetches database configuration from storage
- `updateDatabaseConfig()` - Persists database configuration to storage
- Default configuration values
- Security (password omission in responses)

## Security

The Database Configuration feature implements the following security measures:

1. Admin-only access for all database configuration operations
2. JWT-based authentication required for all API endpoints
3. Password is never returned in API responses
4. Empty password fields are ignored during updates (keeps existing password)
5. SSL/TLS option for secure database connections

## Usage Flow

1. An administrator navigates to the Configuration page
2. The administrator expands the "Database Connection" card
3. The component fetches and displays current settings (minus password)
4. The administrator modifies connection parameters
5. Before saving, they test the connection to verify it works
6. After successful testing, they save the configuration
7. A message informs them that server restart may be required for changes to take effect

## Important Notes

- **Server Restart Requirement**: After changing database configuration, the server needs to be restarted to apply the changes to the active connection
- **Password Handling**: When editing, leaving the password field empty preserves the existing password
- **Connection Testing**: Testing a connection uses a temporary client and doesn't affect the current active database connection
- **Error Handling**: User-friendly error messages are provided for common connection issues

## Implementation Details

### Configuration Storage

Database configuration is stored in the `config` table in the PostgreSQL database with:
- `name = 'database'`
- `value` containing the JSON configuration object
- Password is stored securely (not in plaintext)

### Connection Testing Process

1. The frontend sends connection parameters to the API
2. A temporary PostgreSQL client is created with those parameters
3. The client attempts to connect and execute a simple query
4. The connection is closed and the result/error is returned to the frontend
5. User-friendly error messages are displayed for common issues

## Troubleshooting

Common issues and their solutions:

1. **Connection Failed**: Check that the PostgreSQL server is running and accessible from the application server
2. **Authentication Failed**: Verify username and password
3. **Database Not Found**: Ensure the database name is correct
4. **Configuration Not Saved**: Ensure the user has admin privileges
5. **Changes Not Applied**: Restart the application server to apply new configuration