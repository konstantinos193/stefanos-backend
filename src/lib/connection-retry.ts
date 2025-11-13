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
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      // Test the connection with a simple MongoDB operation
      // MongoDB doesn't support SQL queries, so we use a simple findFirst
      await prisma.$runCommandRaw({ ping: 1 });
      console.log('✅ Database connection successful');
      return;
    } catch (error: any) {
      const isLastAttempt = i === maxRetries - 1;
      
      if (isLastAttempt) {
        console.error('❌ Database connection failed after retries:', error);
        console.error('\n💡 Please check:');
        console.error('   1. Your DATABASE_URL in .env file (should be MongoDB connection string)');
        console.error('   2. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing or your IP)');
        console.error('   3. Network connectivity and firewall settings');
        console.error('   4. MongoDB Atlas cluster is running and accessible (not paused)');
        console.error('   5. SSL/TLS configuration is correct');
        throw error;
      }
      
      console.log(`⚠️  Connection attempt ${i + 1}/${maxRetries} failed, retrying in ${delay}ms...`);
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
      
      // Check if it's a connection error that we should retry
      const isConnectionError = 
        error.code === 'P2010' || 
        error.message?.includes('timeout') ||
        error.message?.includes('InternalError') ||
        error.message?.includes('Server selection timeout') ||
        error.message?.includes('fatal alert') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ENOTFOUND');

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
        }
        throw error;
      }

      console.log(`   ⚠️  ${operationName} failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`);
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

