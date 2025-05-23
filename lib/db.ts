import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI && !process.env.MONGODB_URI_OVERRIDE) {
  throw new Error('Please add your MongoDB connection string to .env.local');
}

const uri = process.env.MONGODB_URI_OVERRIDE || process.env.MONGODB_URI || 'mongodb+srv://prepcrazyofficial:wKVWNW5wO9pMsthV@projectiq.oagucoi.mongodb.net/?retryWrites=true&w=majority&appName=projectiq';
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

export async function getDB(dbName = 'projectiq') {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getCollection(collectionName: string, dbName = 'projectiq') {
  const db = await getDB(dbName);
  return db.collection(collectionName);
} 