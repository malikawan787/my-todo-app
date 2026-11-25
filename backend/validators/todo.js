import { z } from 'zod';
import { PRIORITIES } from '../models/Todo.js';

const title = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Title must be 200 characters or fewer');

const description = z.string().trim().max(2000, 'Description must be 2000 characters or fewer');

const priority = z.enum(PRIORITIES);

// Accepts "2026-12-31" (or a full date). null means "no due date".
const dueDate = z.coerce.date().nullable();

// Lowercase, no blanks, no duplicates
const tags = z
  .array(z.string().trim().toLowerCase().min(1).max(30))
  .max(10, 'Use at most 10 tags')
  .transform((list) => [...new Set(list)]);

// For creating: only the title is required
export const createTodoSchema = z.object({
  title,
  description: description.default(''),
  priority: priority.default('medium'),
  dueDate: dueDate.default(null),
  tags: tags.default([]),
});

// For editing: every field is optional, but you must send at least one
export const updateTodoSchema = z
  .object({ title, description, completed: z.boolean(), priority, dueDate, tags })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Send at least one field to update');

// Checks that the :id in the URL looks like a MongoDB id
export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid todo id'),
});

// The part of the URL after "?". It all arrives as text, so numbers are converted.
export const listTodosQuerySchema = z.object({
  status: z.enum(['all', 'active', 'completed']).default('all'),
  priority: priority.optional(),
  tag: z.string().trim().toLowerCase().max(30).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['newest', 'oldest', 'due']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});