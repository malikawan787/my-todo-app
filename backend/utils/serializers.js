export function toTodoDTO(todo) {
    return {
      id: String(todo._id),
      title: todo.title,
      description: todo.description ?? '',
      completed: todo.completed,
      completedAt: todo.completedAt ?? null,
      priority: todo.priority,
      dueDate: todo.dueDate ?? null,
      tags: todo.tags ? [...todo.tags] : [],
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }