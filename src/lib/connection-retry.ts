import { PrismaClient } from '@prisma/client';

/**
 * Retry connection with exponential backoff
 */
export async function connectWithRetry(
  prisma: PrismaClient,
  maxRetries = 5,
  initialDelay = 2000
): Promise<void> {
  let delay = initialDelay;
  
  // Log connection string info (without password) for debugging
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔗 Attempting to connect to MongoDB...`);
  console.log(`   Connection string: ${maskedUrl.substring(0, 80)}...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      // Test the connection with a simple MongoDB operation
      await prisma.$runCommandRaw({ ping: 1 });
      console.log('✅ Database connection successful');
      return;
    } catch (error: any) {
      const isLastAttempt = i === maxRetries - 1;
      
      // Extract more detailed error information
      const errorMessage = error.message || String(error);
      const errorCode = error.code || error.name || 'UNKNOWN';
      
      console.error(`❌ Connection attempt ${i + 1}/${maxRetries} failed`);
      console.error(`   Error: ${errorCode} - ${errorMessage.substring(0, 200)}`);
      
      if (isLastAttempt) {
        console.error('\n💡 Troubleshooting steps:');
        console.error('   1. Check DATABASE_URL in .env file:');
        console.error('      - Format: mongodb+srv://user:pass@cluster.mongodb.net/database_name');
        console.error('      - Ensure database name is included (e.g., /real_estate_db)');
        console.error('      - Remove any trailing newlines or spaces');
        console.error('   2. MongoDB Atlas IP Whitelist:');
        console.error('      - Go to Atlas Dashboard → Network Access');
        console.error('      - Add your IP address or 0.0.0.0/0 for testing');
        console.error('   3. Check MongoDB Atlas cluster status:');
        console.error('      - Ensure cluster is running (not paused)');
        console.error('      - Verify cluster name matches connection string');
        console.error('   4. Network/Firewall:');
        console.error('      - Check if your network blocks MongoDB Atlas (port 27017)');
        console.error('      - Try from a different network to test');
        console.error('   5. Credentials:');
        console.error('      - Verify username and password are correct');
        console.error('      - Check if database user has proper permissions');
        
        // Provide specific error-based suggestions
        if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
          console.error('\n   🔑 Authentication Error: Check username/password');
        }
        if (errorMessage.includes('timeout') || errorMessage.includes('Server selection') || errorMessage.includes('fatal alert')) {
          console.error('\n   ⏱️  Connection Timeout / IP Whitelist Error:');
          console.error('      This is almost always an IP whitelist issue!');
          console.error('      📋 Quick Fix Steps:');
          console.error('         1. Go to: https://cloud.mongodb.com');
          console.error('         2. Select your cluster');
          console.error('         3. Click "Network Access" (or "IP Access List")');
          console.error('         4. Click "Add IP Address"');
          console.error('         5. For development: Add "0.0.0.0/0" (allows all IPs)');
          console.error('            OR add your specific IP address');
          console.error('         6. Wait 1-2 minutes for changes to propagate');
          console.error('         7. Restart the backend server');
        }
        if (errorMessage.includes('TLS') || errorMessage.includes('SSL')) {
          console.error('\n   🔒 TLS/SSL Error: Check connection string includes TLS parameters');
        }
        
        throw error;
      }
      
      console.log(`   ⚠️  Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

/**
 * Retry wrapper for database operations with better error handling
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  prisma: PrismaClient,
  maxRetries = 5,
  initialDelay = 1000
): Promise<T> {
  let delay = initialDelay;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const isLastAttempt = i === maxRetries - 1;
      
      // Extract error message for detailed checks
      const errorMessage = error.message || String(error);
      
      // Check if it's a connection error that we should retry
      const isConnectionError = 
        error.code === 'P2010' || 
        error.message?.includes('timeout') ||
        error.message?.includes('InternalError') ||
        error.message?.includes('Server selection timeout') ||
        error.message?.includes('fatal alert') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ENOTFOUND') ||
        error.message?.includes('ReplicaSetNoPrimary');

      // Check if it's a transaction error (MongoDB Atlas M0 doesn't support transactions)
      const isTransactionError = 
        error.message?.includes('Transactions are not supported') ||
        error.message?.includes('transaction');

      if (isTransactionError) {
        console.error(`   ❌ ${operationName} failed: Transactions are not supported by this MongoDB deployment`);
        console.error('   💡 This usually means you are using MongoDB Atlas M0 (free tier)');
        console.error('   💡 The seed script should avoid transactions - this may be a Prisma issue');
        throw error;
      }

      if (isLastAttempt || !isConnectionError) {
        // If it's not a connection error or it's the last attempt, throw
        if (!isConnectionError) {
          console.error(`   ❌ ${operationName} failed with non-connection error:`, error.message);
        } else if (isLastAttempt) {
          // Last attempt failed - provide detailed guidance
          console.error(`\n   ❌ ${operationName} failed after ${maxRetries} retries`);
          if (errorMessage.includes('fatal alert') || errorMessage.includes('Server selection timeout') || errorMessage.includes('ReplicaSetNoPrimary')) {
            console.error('\n   🔴 MONGODB IP WHITELIST ISSUE DETECTED!');
            console.error('   Your IP address is not whitelisted in MongoDB Atlas.');
            console.error('   📋 Fix this now:');
            console.error('      1. Go to: https://cloud.mongodb.com');
            console.error('      2. Network Access → Add IP Address');
            console.error('      3. Add "0.0.0.0/0" for development (or your specific IP)');
            console.error('      4. Wait 1-2 minutes, then restart the backend');
          }
        }
        throw error;
      }

      console.log(`   ⚠️  ${operationName} failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`);
      if (errorMessage.includes('fatal alert') || errorMessage.includes('Server selection timeout')) {
        console.log(`   💡 This looks like an IP whitelist issue - check MongoDB Atlas Network Access`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Slight backoff
      
      // Try to reconnect if connection was lost
      try {
        await prisma.$connect();
      } catch (reconnectError) {
        // Ignore reconnect errors, will retry operation
        console.log(`   ⚠️  Reconnection attempt failed, will retry operation...`);
      }
    }
  }
  
  throw new Error(`Operation ${operationName} failed after ${maxRetries} retries`);
}

/**
 * Small delay between operations to avoid overwhelming the connection
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

