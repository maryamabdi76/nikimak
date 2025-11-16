import { MongoClient, MongoClientOptions } from 'mongodb';

import { attachDatabasePool } from '@vercel/functions';

const options: MongoClientOptions = {
  appName: 'devrel.vercel.integration',
  maxIdleTimeMS: 5000,
};
const clientPromise = new MongoClient(process.env.MONGODB_URI!, options);

// Attach the client to ensure proper cleanup on function suspension
attachDatabasePool(clientPromise);

// Export a module-scoped MongoClient to ensure the client can be shared across functions.
export default clientPromise;
