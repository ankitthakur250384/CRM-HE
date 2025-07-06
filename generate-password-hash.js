#!/usr/bin/env node
// Password Hash Generator for ASP Cranes CRM
// This script generates bcrypt hashes for secure password storage
// 
// Usage:
//   node generate-password-hash.js
//   node generate-password-hash.js your_password
//
// Install dependencies first:
//   npm install bcrypt

const bcrypt = require('bcrypt');
const readline = require('readline');

const SALT_ROUNDS = 12; // Higher for production security

async function generateHash(password) {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        return hash;
    } catch (error) {
        console.error('Error generating hash:', error);
        return null;
    }
}

async function verifyHash(password, hash) {
    try {
        const isValid = await bcrypt.compare(password, hash);
        return isValid;
    } catch (error) {
        console.error('Error verifying hash:', error);
        return false;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Password provided as argument
        const password = args[0];
        console.log(`🔐 Generating hash for: "${password}"`);
        const hash = await generateHash(password);
        if (hash) {
            console.log(`\n📝 Hash: ${hash}`);
            console.log(`\n✅ Verification: ${await verifyHash(password, hash)}`);
        }
        return;
    }

    // Interactive mode
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🚀 ASP Cranes CRM Password Hash Generator');
    console.log('==========================================');
    console.log('This tool generates secure bcrypt hashes for user passwords.\n');

    rl.question('Enter password to hash (or press Enter for demo passwords): ', async (input) => {
        if (!input.trim()) {
            // Generate hashes for common demo passwords
            console.log('\n📝 Generating hashes for demo passwords...\n');
            
            const demoPasswords = [
                'password123',
                'admin123',
                'sales123',
                'manager123',
                'operator123'
            ];

            for (const pwd of demoPasswords) {
                const hash = await generateHash(pwd);
                if (hash) {
                    console.log(`Password: "${pwd}"`);
                    console.log(`Hash: ${hash}`);
                    console.log('---');
                }
            }
        } else {
            const hash = await generateHash(input);
            if (hash) {
                console.log(`\n📝 Generated hash for: "${input}"`);
                console.log(`Hash: ${hash}`);
                console.log(`\n✅ Verification test: ${await verifyHash(input, hash)}`);
            }
        }
        
        console.log('\n⚠️  Security Notes:');
        console.log('• Copy the hash to your SQL script');
        console.log('• Never store plain text passwords');
        console.log('• Use HTTPS in production');
        console.log('• Consider password complexity requirements\n');
        
        rl.close();
    });
}

// Handle script execution
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateHash, verifyHash };
