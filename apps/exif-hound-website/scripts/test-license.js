#!/usr/bin/env node

/**
 * Simple script to test license key verification
 * Usage: node scripts/test-license.js EXH-ABCDE-FGHIJ-KLMNO-PQRST
 */

// Using CommonJS style for compatibility
const http = require('http');

async function verifyLicense(licenseKey) {
  try {
    console.log(`Testing license key: ${licenseKey}`);
    
    // Use built-in http module instead of node-fetch
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/verify-license',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            console.log('\nResponse:');
            console.log(JSON.stringify(parsedData, null, 2));
            
            if (parsedData.valid) {
              console.log('\n✅ License is valid');
              console.log(`Product: ${parsedData.productId}`);
              console.log(`Expires: ${new Date(parsedData.expiresAt).toLocaleDateString()}`);
            } else {
              console.log('\n❌ License is invalid');
              console.log(`Error: ${parsedData.error}`);
              
              if (parsedData.expiresAt) {
                console.log(`Expired on: ${new Date(parsedData.expiresAt).toLocaleDateString()}`);
              }
            }
            resolve(parsedData);
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('\n❌ Error verifying license:', error.message);
        console.log('Make sure your Next.js server is running at http://localhost:3000');
        reject(error);
      });
      
      // Send the request with the license key
      req.write(JSON.stringify({ licenseKey }));
      req.end();
    });
  } catch (error) {
    console.error('\n❌ Error verifying license:', error.message);
    console.log('Make sure your Next.js server is running at http://localhost:3000');
  }
}

// Get license key from command line arguments
const licenseKey = process.argv[2];

if (!licenseKey) {
  console.log('Please provide a license key as an argument');
  console.log('Usage: node scripts/test-license.js EXH-ABCDE-FGHIJ-KLMNO-PQRST');
  process.exit(1);
}

verifyLicense(licenseKey); 