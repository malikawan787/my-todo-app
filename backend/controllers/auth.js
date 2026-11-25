import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { loginSchema, registerSchema } from '../validators/auth.js';

// Creates the "ID card" (token) we give the user after sign up or log in
function signToken(user) {
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

// What we send back after sign up or log in: public user info + the token
function sessionResponse(user) {
  return {
    data: {
      user: { id: user.id, name: user.name, email: user.email },
      token: signToken(user),
    },
  };
}

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password } = registerSchema.parse(req.body ?? {});

  const exists = await User.exists({ email });
  if (exists) throw new ApiError(409, 'That email is already registered');

  const user = await User.create({ name, email, password });
  res.status(201).json(sessionResponse(user));
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body ?? {});

  // The password is hidden by default (select: false), so we ask for it with +password
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.verifyPassword(password))) {
    // Same message for "no such user" and "wrong password" on purpose
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json(sessionResponse(user));
}

// GET /api/auth/me  (only for signed-in users)
export function me(req, res) {
  const { id, name, email } = req.user;
  res.json({ data: { user: { id, name, email } } });
}