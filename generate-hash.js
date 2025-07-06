import bcrypt from 'bcrypt';

async function generateHash() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    console.log('Generated hash for password123:');
    console.log(hash);
    
    // Test the hash
    const isValid = await bcrypt.compare('password123', hash);
    console.log('Verification test:', isValid);
    
    console.log('\nSQL command to update users:');
    console.log(`UPDATE users SET password_hash = '${hash}';`);
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();
