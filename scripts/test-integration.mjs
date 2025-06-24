/**
 * Integration Test Script
 * This script tests the integration between the frontend and backend
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app for our test
const app = express();
const PORT = 3002; // Use a different port from our main app

// Get directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a simple HTML file to test the login
const testHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASP CRM Login Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      border: 1px solid #ddd;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    button {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      margin: 10px 0;
    }
    button:hover {
      background: #45a049;
    }
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    input {
      padding: 8px;
      margin: 5px 0;
      width: 100%;
      box-sizing: border-box;
    }
    label {
      display: block;
      margin-top: 10px;
    }
    .success { color: green; }
    .error { color: red; }
  </style>
</head>
<body>
  <h1>ASP CRM - PostgreSQL Authentication Test</h1>
  
  <div class="container">
    <h2>Login Test</h2>
    <form id="loginForm">
      <label for="email">Email:</label>
      <input type="email" id="email" value="admin@aspcranes.com">
      
      <label for="password">Password:</label>
      <input type="password" id="password" value="admin123">
      
      <button type="submit">Login</button>
    </form>
    
    <div id="loginResult"></div>
  </div>
  
  <div class="container">
    <h2>Token Verification Test</h2>
    <button id="verifyToken">Verify Token</button>
    <div id="verifyResult"></div>
  </div>
  
  <div class="container">
    <h2>Database Query Test</h2>
    <button id="testQuery">Run Test Query</button>
    <div id="queryResult"></div>
  </div>
  
  <script>
    // API endpoint
    const API_URL = '${process.env.VITE_API_URL || 'http://localhost:3001/api'}';
    let savedToken = '';
    
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const resultDiv = document.getElementById('loginResult');
      
      try {
        resultDiv.innerHTML = '<p>Logging in...</p>';
        
        const response = await fetch(\`\${API_URL}/auth/login\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          savedToken = data.token;
          localStorage.setItem('jwt-token', data.token);
          resultDiv.innerHTML = \`
            <p class="success">Login successful!</p>
            <p>User: \${data.user.name} (\${data.user.email})</p>
            <p>Role: \${data.user.role}</p>
            <p>Token: \${data.token.substring(0, 20)}...</p>
          \`;
        } else {
          resultDiv.innerHTML = \`<p class="error">Login failed: \${data.error}</p>\`;
        }
      } catch (error) {
        resultDiv.innerHTML = \`<p class="error">Error: \${error.message}</p>\`;
      }
    });
    
    // Token verification
    document.getElementById('verifyToken').addEventListener('click', async () => {
      const resultDiv = document.getElementById('verifyResult');
      
      try {
        const token = savedToken || localStorage.getItem('jwt-token');
        
        if (!token) {
          resultDiv.innerHTML = '<p class="error">No token available. Please login first.</p>';
          return;
        }
        
        resultDiv.innerHTML = '<p>Verifying token...</p>';
        
        const response = await fetch(\`\${API_URL}/auth/verify-token\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          resultDiv.innerHTML = \`
            <p class="success">Token verified successfully!</p>
            <p>User: \${data.user.name} (\${data.user.email})</p>
            <p>Role: \${data.user.role}</p>
          \`;
        } else {
          resultDiv.innerHTML = \`<p class="error">Verification failed: \${data.error}</p>\`;
        }
      } catch (error) {
        resultDiv.innerHTML = \`<p class="error">Error: \${error.message}</p>\`;
      }
    });
    
    // Test query
    document.getElementById('testQuery').addEventListener('click', async () => {
      const resultDiv = document.getElementById('queryResult');
      
      try {
        const token = savedToken || localStorage.getItem('jwt-token');
        
        if (!token) {
          resultDiv.innerHTML = '<p class="error">No token available. Please login first.</p>';
          return;
        }
        
        resultDiv.innerHTML = '<p>Running query...</p>';
        
        const response = await fetch(\`\${API_URL}/db/query\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({
            type: 'any',
            query: 'SELECT uid, email, role FROM users LIMIT 5',
            values: []
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          resultDiv.innerHTML = \`
            <p class="success">Query executed successfully!</p>
            <pre>\${JSON.stringify(data, null, 2)}</pre>
          \`;
        } else {
          resultDiv.innerHTML = \`<p class="error">Query failed: \${data.error}</p>\`;
        }
      } catch (error) {
        resultDiv.innerHTML = \`<p class="error">Error: \${error.message}</p>\`;
      }
    });
  </script>
</body>
</html>
`;

// Create routes
app.use(cors());
app.use(express.json());

// Serve the test HTML
app.get('/', (req, res) => {
  res.send(testHtml);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`API server should be running at ${process.env.VITE_API_URL || 'http://localhost:3001/api'}`);
  
  // Open the test page in the default browser
  open(`http://localhost:${PORT}`);
});
