/**
 * Simple test to check if the server is running
 */
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

async function checkServer() {
  try {
    console.log('Testing server connection...');
    const response = await fetch(`${API_URL}/api/equipment/debug/status`);
    
    if (response.ok) {
      console.log('Server is responding!');
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.log('Server responded with status:', response.status);
    }
  } catch (error) {
    console.error('Cannot connect to server:', error.message);
  }
}

checkServer().then(() => console.log('Done'));
