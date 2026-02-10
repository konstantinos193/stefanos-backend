/**
 * Minimal adapter stub for MongoDB with Prisma 7
 * 
 * This is a workaround for Prisma 7's requirement of an adapter even when using
 * the binary engine with MongoDB. Since MongoDB isn't officially supported in Prisma 7,
 * this stub satisfies the type requirements but doesn't interfere with MongoDB operations
 * which use the binary engine directly.
 */

import type { SqlDriverAdapterFactory } from '../../prisma/generated/prisma/runtime/client';

// These types are not exported from the Prisma runtime client, so we define them locally
// based on the internal declarations in the generated client
type IsolationLevel = 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SNAPSHOT' | 'SERIALIZABLE';

type SqlQuery = {
  sql: string;
  args: Array<unknown>;
  argTypes: Array<unknown>;
};

interface SqlResultSet {
  columnTypes: Array<unknown>;
  columnNames: Array<string>;
  rows: Array<Array<unknown>>;
  lastInsertId?: string;
}

type ConnectionInfo = {
  schemaName?: string;
  maxBindValues?: number;
  supportsRelationJoins: boolean;
};

type TransactionOptions = {
  usePhantomQuery: boolean;
};

interface Transaction {
  // From AdapterInfo
  readonly provider: string;
  readonly adapterName: string;
  // From SqlQueryable (Queryable<SqlQuery, SqlResultSet>)
  queryRaw(params: SqlQuery): Promise<SqlResultSet>;
  executeRaw(params: SqlQuery): Promise<number>;
  // From Transaction
  readonly options: TransactionOptions;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

interface SqlDriverAdapter {
  // From AdapterInfo
  readonly provider: string;
  readonly adapterName: string;
  // From Queryable<SqlQuery, SqlResultSet>
  queryRaw(params: SqlQuery): Promise<SqlResultSet>;
  executeRaw(params: SqlQuery): Promise<number>;
  // From SqlDriverAdapter
  executeScript(script: string): Promise<void>;
  startTransaction(isolationLevel?: IsolationLevel): Promise<Transaction>;
  getConnectionInfo?(): ConnectionInfo;
  dispose(): Promise<void>;
}

/**
 * Stub adapter factory that satisfies Prisma 7's type requirements
 * but doesn't actually do anything since MongoDB uses the binary engine
 */
export const mongodbAdapterStub = {
  provider: 'mongodb' as any,
  adapterName: 'mongodb-stub' as any,
  connect: async () => {
    // This should never be called since MongoDB uses the binary engine
    throw new Error(
      'MongoDB adapter stub should not be used. MongoDB uses the binary engine directly. ' +
      'This is a workaround for Prisma 7 type requirements.'
    );
  },
} as SqlDriverAdapterFactory; // Type assertion needed because we can't perfectly match internal types
