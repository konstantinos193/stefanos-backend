#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

let authToken = '';

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;
  
  switch(type) {
    case 'success':
      console.log(`${prefix} ✅ ${message}`);
      break;
    case 'error':
      console.log(`${prefix} ❌ ${message}`);
      break;
    case 'warning':
      console.log(`${prefix} ⚠️  ${message}`);
      break;
    case 'info':
    default:
      console.log(`${prefix} ℹ️  ${message}`);
      break;
  }
}

async function makeRequest(method, endpoint, data = null, requireAuth = false) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    if (requireAuth && authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await axios(config);
    
    log(`${method} ${endpoint} - ${response.status} ${response.statusText}`, 'success');
    return { success: true, status: response.status, data: response.data };
    
  } catch (error) {
    const status = error.response?.status || 'NO_RESPONSE';
    const message = error.response?.data?.message || error.message;
    
    log(`${method} ${endpoint} - ${status}: ${message}`, 'error');
    return { success: false, status, error: message };
  }
}

// Test functions
async function testHealthEndpoints() {
  log('\n=== Testing Health Endpoints ===', 'info');
  
  await makeRequest('GET', '/health');
  await makeRequest('GET', '/health/stats');
}

async function testAuthEndpoints() {
  log('\n=== Testing Authentication Endpoints ===', 'info');
  
  // Test registration
  const registerResult = await makeRequest('POST', '/auth/register', TEST_USER);
  
  // Test login
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    log('Authentication token obtained successfully', 'success');
  }
  
  // Test protected auth endpoint
  await makeRequest('GET', '/auth/me', null, true);
}

async function testPublicEndpoints() {
  log('\n=== Testing Public Endpoints ===', 'info');
  
  await makeRequest('GET', '/properties');
  await makeRequest('GET', '/rooms/public/all');
  await makeRequest('GET', '/services');
  await makeRequest('GET', '/reviews');
}

async function testProtectedEndpoints() {
  log('\n=== Testing Protected Endpoints ===', 'info');
  
  if (!authToken) {
    log('No auth token available, skipping protected endpoints', 'warning');
    return;
  }
  
  // User endpoints
  await makeRequest('GET', '/users', null, true);
  await makeRequest('GET', '/users/me', null, true);
  
  // Property endpoints
  await makeRequest('GET', '/properties/protected', null, true);
  
  // Booking endpoints
  await makeRequest('GET', '/bookings', null, true);
  await makeRequest('GET', '/bookings/export', null, true);
  
  // Room endpoints (protected)
  await makeRequest('GET', '/rooms', null, true);
  
  // Content & Media (will likely fail due to permissions)
  await makeRequest('GET', '/content', null, true);
  await makeRequest('GET', '/media', null, true);
  
  // Settings
  await makeRequest('GET', '/settings', null, true);
}

async function testSpecialEndpoints() {
  log('\n=== Testing Special Endpoints ===', 'info');
  
  // Test endpoints that might not exist or have specific routes
  const specialEndpoints = [
    '/payments',
    '/payments/public/checkout-session',
    '/cleaning',
    '/analytics',
    '/admin',
    '/logs',
    '/external-bookings',
    '/property-groups',
    '/editions',
    '/knowledge',
    '/upload',
    '/notifications'
  ];
  
  for (const endpoint of specialEndpoints) {
    await makeRequest('GET', endpoint);
  }
}

async function testErrorHandling() {
  log('\n=== Testing Error Handling ===', 'info');
  
  // Test 404
  await makeRequest('GET', '/nonexistent-endpoint');
  
  // Test invalid methods
  await makeRequest('POST', '/health');
  await makeRequest('DELETE', '/properties');
  
  // Test invalid data
  await makeRequest('POST', '/auth/register', { invalid: 'data' });
  
  // Test unauthorized access
  await makeRequest('GET', '/users');
}

async function generateReport(results) {
  log('\n=== Test Summary ===', 'info');
  
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = totalTests - successfulTests;
  
  log(`Total Tests: ${totalTests}`, 'info');
  log(`Successful: ${successfulTests}`, 'success');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'success');
  log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(2)}%`, 'info');
  
  if (failedTests > 0) {
    log('\nFailed Tests:', 'warning');
    results.filter(r => !r.success).forEach(result => {
      log(`  - ${result.method} ${result.endpoint}: ${result.status} - ${result.error}`, 'error');
    });
  }
  
  // Categorize errors
  const errorTypes = {
    'MongoDB': results.filter(r => r.error && r.error.includes('MongoDB')),
    '404 Not Found': results.filter(r => r.status === 404),
    '401 Unauthorized': results.filter(r => r.status === 401),
    '403 Forbidden': results.filter(r => r.status === 403),
    '500 Internal Server': results.filter(r => r.status === 500),
    'Other': results.filter(r => !r.success && r.status !== 404 && r.status !== 401 && r.status !== 403 && r.status !== 500)
  };
  
  log('\nError Categories:', 'info');
  Object.entries(errorTypes).forEach(([type, errors]) => {
    if (errors.length > 0) {
      log(`  ${type}: ${errors.length}`, type === 'MongoDB' ? 'error' : 'warning');
    }
  });
  
  if (errorTypes['MongoDB'].length > 0) {
    log('\n⚠️  MongoDB Connection Issues Detected!', 'warning');
    log('The following endpoints failed due to MongoDB connection problems:', 'warning');
    errorTypes['MongoDB'].forEach(err => {
      log(`  - ${err.method} ${err.endpoint}`, 'error');
    });
    log('\nConsider:', 'info');
    log('  1. Checking MongoDB connection configuration', 'info');
    log('  2. Ensuring MongoDB is running', 'info');
    log('  3. Verifying DATABASE_URL environment variable', 'info');
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting Comprehensive API Test Suite', 'info');
  log(`Testing server at: ${BASE_URL}`, 'info');
  
  const allResults = [];
  
  // Store results for reporting
  const originalMakeRequest = makeRequest;
  makeRequest = async function(method, endpoint, data, requireAuth) {
    const result = await originalMakeRequest.call(this, method, endpoint, data, requireAuth);
    allResults.push({ method, endpoint, ...result });
    return result;
  };
  
  try {
    await testHealthEndpoints();
    await testAuthEndpoints();
    await testPublicEndpoints();
    await testProtectedEndpoints();
    await testSpecialEndpoints();
    await testErrorHandling();
    
    await generateReport(allResults);
    
    log('\n✅ Test Suite Completed!', 'success');
    
  } catch (error) {
    log(`\n💥 Test Suite Failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    log('❌ Server is not responding!', 'error');
    log('Please ensure the backend server is running on http://localhost:3001', 'info');
    return false;
  }
}

// Run tests if server is available
if (require.main === module) {
  checkServer().then(serverRunning => {
    if (serverRunning) {
      runAllTests();
    } else {
      process.exit(1);
    }
  });
}

module.exports = {
  runAllTests,
  makeRequest,
  checkServer
};
