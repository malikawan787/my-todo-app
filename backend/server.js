import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { protect } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import todoRoutes from './routes/todo.js';

const app = express();

// When this runs behind a proxy (most hosting services do), remove the // from the next line
// so the rate limiter sees each visitor's real address instead of the proxy's address.
// app.set('trust proxy', 1);

app.use(helmet()); // adds protective headers to every response
app.use(cors({ origin: env.clientOrigins }));
app.use(morgan(env.isProd ? 'combined' : 'dev')); // prints one line per request
app.use(express.json({ limit: '100kb' })); // refuse huge request bodies

// Slow down password guessing: at most 20 FAILED sign-in / sign-up attempts
// per visitor every 15 minutes. Successful requests are not counted.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.json({ status: 'ok', database: connected ? 'connected' : 'not connected' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/todos', protect, todoRoutes); // protect = you must be signed in

// These two must stay AFTER all routes
app.use(notFound);
app.use(errorHandler);

try {
  await connectDB();
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message);
  process.exit(1);
}

const server = app.listen(env.port, (error) => {
  if (error) throw error;
  console.log(`Server running at http://localhost:${env.port} (${env.nodeEnv})`);
});

// Ctrl+C (or a hosting service stopping the app): finish current requests, then close cleanly
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  // If something keeps the server open, force-quit after 10 seconds
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));