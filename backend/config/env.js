import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing. Did you add it to the .env file?`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = required('JWT_SECRET');

// On a real website the secret must be long and random. Refuse to start with a weak one.
if (nodeEnv === 'production' && (jwtSecret.length < 32 || jwtSecret.startsWith('replace-me'))) {
  throw new Error('JWT_SECRET must be a long random string (32+ characters) in production.');
}

export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port: Number(process.env.PORT) || 3000,
  mongoUri: required('MONGODB_URI'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Websites allowed to call this API from a browser (comma-separated)
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:9000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};