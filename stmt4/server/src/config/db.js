import mongoose from 'mongoose';

/**
 * Connects to MongoDB once per process.
 */
export async function connectDb(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
}
