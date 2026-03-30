import serverless from 'serverless-http';
import app from '../src/app.js';
import { connectMongo } from '../src/db.js';

let serverlessHandler;

export default async function handler(req, res) {
  await connectMongo(); // Connect only if not connected
  if (!serverlessHandler) {
    serverlessHandler = serverless(app);
  }
  return serverlessHandler(req, res);
}
