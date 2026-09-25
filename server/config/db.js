import mongoose from 'mongoose';
import { getEnv } from './env.js';
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import Analysis from '../models/Analysis.js';
import Job from '../models/Job.js';
import Match from '../models/Match.js';

const models = [User, Resume, Analysis, Job, Match];

export async function connectDatabase(uri = getEnv().mongoUri) {
  const { nodeEnv } = getEnv();
  mongoose.set('strictQuery', true);
  mongoose.set('autoIndex', nodeEnv !== 'production');
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
    minPoolSize: nodeEnv === 'production' ? 2 : 0
  });
  return mongoose.connection;
}

export async function ensureIndexes() {
  await Promise.all(models.map((model) => model.createIndexes()));
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
