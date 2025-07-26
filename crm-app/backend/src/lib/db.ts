
// Only import pg-promise in Node.js environment
let pgp;
try {
  const pgPromise = require('pg-promise');
  // Initialize pg-promise
  pgp = pgPromise({
    capSQL: true, // capitalize SQL queries
    error: (error: any, e: any) => {
      if (e.cn) {
        // A connection-related error;
        console.error('DB Connection Error:', error);
      } else if (e.query) {
        // A query-related error;
        console.error('DB Query Error:', error);
      } else {
        // Generic DB error
        console.error('DB Error:', error);
      }
    }
  });
} catch (error) {
  console.error('Error importing pg-promise:', error);
}



// Check for required environment variables (for backend, use process.env)
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

const missingEnvVars = requiredEnvVars.filter(
  varName => !process.env[varName]
);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please create a .env file in the backend root with these variables.');
  console.error('If deploying to AWS, use your RDS endpoint, port, username, password, and database name.');
}


// Database connection config for Node.js (backend)
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 30, // use up to 30 connections
  ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Increase timeout for network latency
  query_timeout: 10000,
  connectionTimeoutMillis: 10000,
};


// Create the database instance
let db: any;
let pgpExport: any;

if (pgp) {
  db = pgp(config);
  pgpExport = pgp;

  // Test connection
  db.connect()
    .then((obj: any) => {
      console.log('✅ Database connection successful');
      obj.done();
    })
    .catch((error: any) => {
      console.error('❌ Failed to connect to database:', error);
      if (config.host && config.host.includes('rds.amazonaws.com')) {
        console.error('Check your RDS security group, credentials, and SSL settings.');
      }
    });
}

export { db, pgpExport as pgp };
