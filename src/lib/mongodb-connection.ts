import { URL } from 'url';

/**
 * Normalizes MongoDB connection string to ensure proper SSL/TLS configuration
 * for MongoDB Atlas connections
 */
export function normalizeMongoConnectionString(connectionString: string): string {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  // Parse the connection string
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch (error) {
    throw new Error(`Invalid MongoDB connection string format: ${error}`);
  }

  // Check for database name - MongoDB requires a database name
  // If missing, add a default database name
  const pathname = url.pathname;
  let dbName = pathname.split('/')[1]?.split('?')[0];
  
  if (!dbName || dbName.trim() === '') {
    // No database name specified - use default
    dbName = 'real_estate_db';
    // Reconstruct pathname with database name, preserving query string
    const queryString = url.search;
    url.pathname = `/${dbName}`;
    // Keep the search params separate (they're already in url.search)
    console.log(`⚠️  No database name in connection string, using default: ${dbName}`);
  }

  // For mongodb+srv:// connections (MongoDB Atlas)
  if (url.protocol === 'mongodb+srv:') {
    // Get existing search params
    const params = new URLSearchParams(url.search);

    // Ensure SSL/TLS is enabled (required for MongoDB Atlas)
    if (!params.has('ssl') && !params.has('tls')) {
      params.set('tls', 'true');
    }

    // Set retryWrites for better reliability
    if (!params.has('retryWrites')) {
      params.set('retryWrites', 'true');
    }

    // Set write concern for better reliability
    if (!params.has('w')) {
      params.set('w', 'majority');
    }

    // Set connection timeout options
    if (!params.has('serverSelectionTimeoutMS')) {
      params.set('serverSelectionTimeoutMS', '30000');
    }

    if (!params.has('connectTimeoutMS')) {
      params.set('connectTimeoutMS', '30000');
    }

    if (!params.has('socketTimeoutMS')) {
      params.set('socketTimeoutMS', '30000');
    }

    // Set maxPoolSize for connection pooling
    if (!params.has('maxPoolSize')) {
      params.set('maxPoolSize', '10');
    }

    // Reconstruct the URL with updated parameters
    url.search = params.toString();
  }

  return url.toString();
}

/**
 * Validates MongoDB connection string format and provides suggestions
 */
export function validateConnectionString(connectionString: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!connectionString) {
    issues.push('DATABASE_URL is not set in environment variables');
    suggestions.push('Create a .env file with DATABASE_URL');
    return { isValid: false, issues, suggestions };
  }

  // Check if it's a MongoDB connection string
  if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
    issues.push('DATABASE_URL does not appear to be a MongoDB connection string');
    suggestions.push('Use format: mongodb+srv://username:password@cluster.mongodb.net/database');
    return { isValid: false, issues, suggestions };
  }

  // Check for database name in connection string
  try {
    const url = new URL(connectionString);
    const pathname = url.pathname;
    // Pathname should be like "/database_name" or "/database_name?params"
    const dbName = pathname.split('/')[1]?.split('?')[0];
    if (!dbName || dbName.trim() === '') {
      issues.push('Database name is missing from connection string');
      suggestions.push('Add database name after the host: mongodb+srv://user:pass@cluster.mongodb.net/your_database_name');
      suggestions.push('Example: mongodb+srv://user:pass@cluster.mongodb.net/real_estate_db');
    }
  } catch (error) {
    // URL parsing failed, but we'll let other validations catch it
  }

  // Check for required MongoDB Atlas parameters
  if (connectionString.includes('mongodb+srv://')) {
    if (!connectionString.includes('retryWrites')) {
      suggestions.push('Add retryWrites=true to connection string for better reliability');
    }
    if (!connectionString.includes('w=majority')) {
      suggestions.push('Add w=majority to connection string for write concern');
    }
    if (!connectionString.includes('ssl=true') && !connectionString.includes('tls=true')) {
      suggestions.push('MongoDB Atlas requires SSL/TLS - ensure your connection string includes SSL parameters');
    }
  }

  // Check for common issues
  if (connectionString.includes('localhost') || connectionString.includes('127.0.0.1')) {
    issues.push('Connection string points to localhost, but you may be using MongoDB Atlas');
    suggestions.push('Use your MongoDB Atlas connection string from the Atlas dashboard');
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Gets the normalized connection string from environment variables
 */
export function getNormalizedConnectionString(): string {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return normalizeMongoConnectionString(dbUrl);
}

