import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { api } from '../api/client';

// Tasks per page. Small on purpose, so you can see the pages with just a few tasks.
// Change it to 10 when you are done testing.
const PAGE_SIZE = 5;

const defaultFilters = () => ({
  status: 'all', // all | active | completed
  priority: null, // low | medium | high | null (= any)
  tag: null, // one tag name, or null (= any)
  search: '', // text to look for in titles and notes
  sort: 'newest', // newest | oldest | due
  page: 1,
});

const emptyMeta = () => ({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
const emptyStats = () => ({ total: 0, active: 0, completed: 0 });

export const useTodosStore = defineStore('todos', () => {
  const items = ref([]);
  const meta = ref(emptyMeta()); // { page, limit, total, totalPages } sent by the API
  const stats = ref(emptyStats());
  const loading = ref(false);
  const filters = reactive(defaultFilters());

  async function fetchTodos() {
    loading.value = true;
    try {
      // Only send the filters that are actually set
      const params = {
        status: filters.status,
        sort: filters.sort,
        page: filters.page,
        limit: PAGE_SIZE,
      };
      if (filters.priority) params.priority = filters.priority;
      if (filters.tag) params.tag = filters.tag;
      const search = (filters.search ?? '').trim();
      if (search) params.search = search;

      const { data } = await api.get('/todos', { params });

      // We removed the last task on the last page: step back to a page that exists.
      // (Changing filters.page makes the page watcher in TodosPage fetch again.)
      if (data.data.length === 0 && data.meta.page > 1) {
        filters.page = data.meta.totalPages;
        return;
      }

      items.value = data.data;
      meta.value = data.meta;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats() {
    const { data } = await api.get('/todos/stats');
    stats.value = data.data;
  }

  // Reload the list and the counters together
  const refresh = () => Promise.all([fetchTodos(), fetchStats()]);

  async function createTodo(payload) {
    await api.post('/todos', payload);
    await refresh();
  }

  // The API accepts any part of a todo: title, description, completed, priority, dueDate, tags
  async function updateTodo(id, payload) {
    await api.patch(`/todos/${id}`, payload);
    await refresh();
  }

  const toggleTodo = (todo) => updateTodo(todo.id, { completed: !todo.completed });

  async function removeTodo(id) {
    await api.delete(`/todos/${id}`);
    await refresh();
  }

  async function clearCompleted() {
    await api.delete('/todos/completed');
    await refresh();
  }

  // Forget everything, so the next person who signs in never sees these tasks
  function reset() {
    items.value = [];
    meta.value = emptyMeta();
    stats.value = emptyStats();
    Object.assign(filters, defaultFilters());
  }

  return {
    items,
    meta,
    stats,
    loading,
    filters,
    fetchTodos,
    fetchStats,
    refresh,
    createTodo,
    updateTodo,
    toggleTodo,
    removeTodo,
    clearCompleted,
    reset,
  };
});