import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { app } from './app.js';
import { connectDatabase, disconnectDatabase, ensureIndexes } from './config/db.js';
import { getEnv } from './config/env.js';

let httpServer;
let shuttingDown = false;

export { app };

export async function start() {
  if (httpServer) {
    return httpServer;
  }
  const environment = getEnv();
  await fs.mkdir(environment.uploadDirectory, { recursive: true, mode: 0o700 });
  await connectDatabase(environment.mongoUri);
  try {
    await ensureIndexes();
    httpServer = await new Promise((resolve, reject) => {
      const onStartupError = (error) => reject(error);
      const server = app.listen(environment.port, () => {
        server.off('error', onStartupError);
        resolve(server);
      });
      server.once('error', onStartupError);
    });
  } catch (error) {
    await disconnectDatabase();
    throw error;
  }
  console.warn(`CV Analyzer API listening on port ${environment.port}`);
  return httpServer;
}

export async function stop() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
    httpServer = undefined;
  }
  await disconnectDatabase();
  shuttingDown = false;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    stop()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
}

const entryPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (entryPath === import.meta.url) {
  start().catch((error) => {
    console.error(`Server failed to start: ${error.message}`);
    process.exitCode = 1;
  });
}
