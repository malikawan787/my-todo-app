import { Todo } from '../models/Todo.js';
import { ApiError } from '../utils/ApiError.js';
import { toTodoDTO } from '../utils/serializers.js';
import {
  createTodoSchema,
  idParamSchema,
  listTodosQuerySchema,
  updateTodoSchema,
} from '../validators/todo.js';

// Makes user text safe inside a search pattern (so characters like "." or "(" are not special)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// MongoDB puts todos with NO date first when sorting dates upward. For "due soonest" we
// pretend such todos are due in the year 9999, so they end up last.
const NO_DUE_DATE = new Date('9999-12-31T00:00:00.000Z');

// Finds one todo, but ONLY if it belongs to the signed-in user.
async function findMyTodo(req) {
  const { id } = idParamSchema.parse(req.params);
  const todo = await Todo.findOne({ _id: id, user: req.user._id });
  if (!todo) throw new ApiError(404, 'Todo not found');
  return todo;
}

// POST /api/todos
export async function createTodo(req, res) {
  const data = createTodoSchema.parse(req.body ?? {});
  const todo = await Todo.create({ ...data, user: req.user._id });
  res.status(201).json({ data: toTodoDTO(todo) });
}

// GET /api/todos?status=&priority=&tag=&search=&sort=&page=&limit=
export async function listTodos(req, res) {
  // Express 5: req.query is read-only. We only read it and get a new, checked object back.
  const { status, priority, tag, search, sort, page, limit } = listTodosQuerySchema.parse(
    req.query,
  );

  // Start with "only MY todos", then narrow it down with whatever was asked for
  const filter = { user: req.user._id };
  if (status !== 'all') filter.completed = status === 'completed';
  if (priority) filter.priority = priority;
  if (tag) filter.tags = tag;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i'); // 'i' = ignore capitals
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const skip = (page - 1) * limit; // how many todos to jump over to reach this page

  // "due" needs the longer aggregate() form because of the missing-date problem above.
  // .lean() gives plain JavaScript objects, which is faster for read-only lists.
  const query =
    sort === 'due'
      ? Todo.aggregate([
          { $match: filter },
          { $addFields: { dueSort: { $ifNull: ['$dueDate', NO_DUE_DATE] } } },
          { $sort: { dueSort: 1, createdAt: -1, _id: -1 } },
          { $skip: skip },
          { $limit: limit },
        ])
      : Todo.find(filter)
          .sort(sort === 'oldest' ? { createdAt: 1, _id: 1 } : { createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

  // Run both at the same time: this page of todos + how many match in total
  const [todos, total] = await Promise.all([query, Todo.countDocuments(filter)]);

  res.json({
    data: todos.map(toTodoDTO),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

// GET /api/todos/stats
export async function getStats(req, res) {
  const user = req.user._id;
  const [total, completed] = await Promise.all([
    Todo.countDocuments({ user }),
    Todo.countDocuments({ user, completed: true }),
  ]);
  res.json({ data: { total, completed, active: total - completed } });
}

// GET /api/todos/:id
export async function getTodo(req, res) {
  const todo = await findMyTodo(req);
  res.json({ data: toTodoDTO(todo) });
}

// PATCH /api/todos/:id
export async function updateTodo(req, res) {
  const todo = await findMyTodo(req);
  const parsed = updateTodoSchema.parse(req.body ?? {});

  // Keep only the fields that were really sent
  const changes = Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => value !== undefined),
  );
  Object.assign(todo, changes);

  // Remember when it was finished (or clear it if it was un-checked)
  if ('completed' in changes) {
    todo.completedAt = changes.completed ? new Date() : null;
  }

  await todo.save();
  res.json({ data: toTodoDTO(todo) });
}

// DELETE /api/todos/:id
export async function deleteTodo(req, res) {
  const todo = await findMyTodo(req);
  await todo.deleteOne();
  res.status(204).end(); // 204 = success, nothing to send back
}

// DELETE /api/todos/completed
export async function clearCompleted(req, res) {
  const { deletedCount } = await Todo.deleteMany({ user: req.user._id, completed: true });
  res.json({ data: { deletedCount } });
}