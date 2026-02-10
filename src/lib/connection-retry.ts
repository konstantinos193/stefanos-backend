import { PrismaClient } from '../../prisma/generated/prisma/client';

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
  console.log(`🔗 Attempting to connect to PostgreSQL...`);
  console.log(`   Connection string: ${maskedUrl.substring(0, 80)}...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      // Test the connection with a simple PostgreSQL query
      await prisma.$queryRaw`SELECT 1`;
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
        console.error('      - Format: postgresql://user:pass@host:port/database');
        console.error('      - Example: postgresql://user:pass@localhost:5432/real_estate_db');
        console.error('      - Remove any trailing newlines or spaces');
        console.error('   2. PostgreSQL Server Status:');
        console.error('      - Ensure PostgreSQL server is running');
        console.error('      - Check if database exists');
        console.error('   3. Network/Firewall:');
        console.error('      - Check if your network blocks PostgreSQL (port 5432)');
        console.error('      - Verify firewall allows connections');
        console.error('   4. Credentials:');
        console.error('      - Verify username and password are correct');
        console.error('      - Check if database user has proper permissions');
        
        // Provide specific error-based suggestions
        if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
          console.error('\n   🔑 Authentication Error: Check username/password');
        }
        if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
          console.error('\n   ⏱️  Connection Timeout Error:');
          console.error('      Check PostgreSQL server is accessible');
          console.error('      Verify DATABASE_URL is correct');
        }
        if (errorMessage.includes('database') && errorMessage.includes('does not exist')) {
          console.error('\n   📊 Database Error: Database does not exist');
          console.error('      Create the database or update DATABASE_URL');
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
        error.message?.includes('connection') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ENOTFOUND') ||
        error.message?.includes('Connection terminated') ||
        error.message?.includes('Connection closed');

      if (isLastAttempt || !isConnectionError) {
        // If it's not a connection error or it's the last attempt, throw
        if (!isConnectionError) {
          console.error(`   ❌ ${operationName} failed with non-connection error:`, error.message);
        } else if (isLastAttempt) {
          // Last attempt failed - provide detailed guidance
          console.error(`\n   ❌ ${operationName} failed after ${maxRetries} retries`);
          if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
            console.error('\n   🔴 POSTGRESQL CONNECTION ISSUE DETECTED!');
            console.error('   Check your DATABASE_URL and PostgreSQL server status.');
            console.error('   📋 Fix this now:');
            console.error('      1. Verify DATABASE_URL format: postgresql://user:pass@host:port/database');
            console.error('      2. Check PostgreSQL server is running');
            console.error('      3. Verify network/firewall allows connections');
            console.error('      4. Check credentials are correct');
          }
        }
        throw error;
      }

      console.log(`   ⚠️  ${operationName} failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`);
      if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
        console.log(`   💡 This looks like a connection issue - check PostgreSQL server and DATABASE_URL`);
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

