#!/usr/bin/env node

/**
 * Standalone Vault Write Test Script
 * Tests reading, modifying, and writing secrets to Vault
 *
 * Usage:
 * node scripts/test-vault-write.js \
 *   --vault-url https://vault.example.com \
 *   --token hvs.xxxxx \
 *   --path secret/path/to/secret \
 *   [--namespace my-namespace]
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    if (value) {
      config[key] = value;
    }
  }

  return config;
}

// Make HTTP request to Vault
function vaultRequest(method, vaultUrl, path, token, data = null, namespace = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(`${vaultUrl}${path}`);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const headers = {
      'X-Vault-Token': token,
      'Content-Type': 'application/json',
    };

    if (namespace) {
      headers['X-Vault-Namespace'] = namespace;
    }

    const options = {
      method,
      headers,
    };

    const req = client.request(parsedUrl, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Main test function
async function testVaultWrite() {
  const config = parseArgs();

  if (!config['vault-url'] || !config.token || !config['path']) {
    console.error('❌ Missing required arguments:');
    console.error('   --vault-url <url>     Vault server URL');
    console.error('   --token <token>       Vault auth token');
    console.error('   --path <path>         Secret path (e.g., secret/myapp/database)');
    console.error('   --namespace <ns>      Optional: Vault namespace');
    process.exit(1);
  }

  const vaultUrl = config['vault-url'];
  const token = config.token;
  const secretPath = config.path;
  const namespace = config.namespace;

  console.log('\n🔐 Vault Write Test Script\n');
  console.log('Configuration:');
  console.log(`  Vault URL: ${vaultUrl}`);
  console.log(`  Secret Path: ${secretPath}`);
  if (namespace) console.log(`  Namespace: ${namespace}`);
  console.log();

  try {
    // Step 1: Read current secret
    console.log('📖 Step 1: Reading current secret...');
    const readPath = `/v1/secret/data/${secretPath}`;
    const readResponse = await vaultRequest('GET', vaultUrl, readPath, token, null, namespace);

    if (readResponse.status !== 200) {
      console.error(`❌ Failed to read secret: ${readResponse.status}`);
      console.error(JSON.stringify(readResponse.data, null, 2));
      process.exit(1);
    }

    const currentData = readResponse.data?.data?.data || {};
    const currentVersion = readResponse.data?.data?.metadata?.version;

    console.log(`✅ Secret read successfully`);
    console.log(`   Current version: ${currentVersion}`);
    console.log(`   Current data:`, currentData);
    console.log();

    // Step 2: Prepare new data
    console.log('✏️  Step 2: Preparing modified data...');
    const timestamp = new Date().toISOString();
    const testValue = `postgres://test-user:test-pass@localhost:5432/testdb-${timestamp}`;
    const newData = {
      ...currentData,
      'POSTGRES_URL': testValue,
      'updated-at': timestamp,
    };

    console.log(`✅ New data prepared:`, newData);
    console.log(`   Modified POSTGRES_URL to: ${testValue}`);
    console.log();

    // Step 3: Write new data
    console.log('💾 Step 3: Writing new data to Vault...');
    const writePath = `/v1/secret/data/${secretPath}`;
    const writePayload = { data: newData };

    console.log(`   POST ${vaultUrl}${writePath}`);
    console.log(`   Payload:`, JSON.stringify(writePayload, null, 2));
    console.log();

    const writeResponse = await vaultRequest('POST', vaultUrl, writePath, token, writePayload, namespace);

    if (writeResponse.status !== 200) {
      console.error(`❌ Failed to write secret: ${writeResponse.status}`);
      console.error(JSON.stringify(writeResponse.data, null, 2));
      process.exit(1);
    }

    const newVersion = writeResponse.data?.data?.metadata?.version;
    const vaultReturnedData = writeResponse.data?.data?.data;

    console.log(`✅ Write request accepted`);
    console.log(`   Response status: ${writeResponse.status}`);
    console.log(`   New version: ${newVersion}`);
    console.log(`   Data in response:`, vaultReturnedData);
    console.log();

    // Step 4: Verify write by reading again
    console.log('🔍 Step 4: Verifying write by reading secret again...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit

    const verifyResponse = await vaultRequest('GET', vaultUrl, readPath, token, null, namespace);

    if (verifyResponse.status !== 200) {
      console.error(`❌ Failed to verify secret: ${verifyResponse.status}`);
      process.exit(1);
    }

    const verifiedData = verifyResponse.data?.data?.data || {};
    const verifiedVersion = verifyResponse.data?.data?.metadata?.version;

    console.log(`✅ Secret verified`);
    console.log(`   Verified version: ${verifiedVersion}`);
    console.log(`   Verified data:`, verifiedData);
    console.log();

    // Step 5: Check if write persisted
    console.log('📊 Step 5: Analyzing results...\n');

    if (verifiedVersion !== newVersion) {
      console.error(`❌ VERSION MISMATCH: Expected ${newVersion}, got ${verifiedVersion}`);
    } else {
      console.log(`✅ Version incremented correctly: ${currentVersion} → ${newVersion}`);
    }

    const postgresUrlPersisted = verifiedData['POSTGRES_URL'] === newData['POSTGRES_URL'];
    if (postgresUrlPersisted) {
      console.log(`✅ POSTGRES_URL persisted correctly`);
      console.log(`   Old value: "${currentData['POSTGRES_URL']}"`);
      console.log(`   New value: "${verifiedData['POSTGRES_URL']}"`);
    } else {
      console.error(`❌ POSTGRES_URL DID NOT PERSIST`);
      console.error(`   Expected: "${newData['POSTGRES_URL']}"`);
      console.error(`   Got: "${verifiedData['POSTGRES_URL']}"`);
    }

    console.log();
    console.log('📋 Summary:');
    console.log(`   Vault URL: ${vaultUrl}`);
    console.log(`   Path: ${secretPath}`);
    console.log(`   Initial version: ${currentVersion}`);
    console.log(`   Final version: ${verifiedVersion}`);
    console.log(`   Version incremented: ${verifiedVersion > currentVersion ? '✅' : '❌'}`);
    console.log(`   POSTGRES_URL updated: ${postgresUrlPersisted ? '✅' : '❌'}`);
    console.log();

    if (verifiedVersion > currentVersion && postgresUrlPersisted) {
      console.log('✅ SUCCESS: Write operation completed successfully!\n');
      process.exit(0);
    } else {
      console.error('❌ FAILURE: Write operation did not persist correctly\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testVaultWrite();
