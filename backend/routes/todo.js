import { Router } from 'express';
import {
  clearCompleted,
  createTodo,
  deleteTodo,
  getStats,
  getTodo,
  listTodos,
  updateTodo,
} from '../controllers/todo.js';

const router = Router();

// Fixed words like "stats" must come BEFORE '/:id'.
// Otherwise Express would think "stats" is a todo id.
router.get('/stats', getStats);
router.delete('/completed', clearCompleted);

router.route('/').get(listTodos).post(createTodo);
router.route('/:id').get(getTodo).patch(updateTodo).delete(deleteTodo);

export default router;