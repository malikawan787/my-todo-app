<template>
  <q-page class="q-pa-md">
    <div class="page-container">
      <!-- counters (always count ALL your tasks, whatever the filters say) -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div v-for="card in statCards" :key="card.label" class="col-4">
          <q-card flat bordered class="stat-card">
            <div class="stat-value" :class="card.tone">{{ card.value }}</div>
            <div class="text-caption">{{ card.label }}</div>
          </q-card>
        </div>
      </div>

      <!-- add a task quickly (title only) -->
      <q-input
        v-model="newTitle"
        outlined
        maxlength="200"
        placeholder="What needs doing?"
        @keyup.enter="addTodo"
      >
        <template #prepend>
          <q-icon name="add_task" />
        </template>
        <template #append>
          <q-btn flat round dense icon="tune" aria-label="Add with details" @click="openCreate">
            <q-tooltip>Add with details</q-tooltip>
          </q-btn>
          <q-btn
            class="q-ml-sm"
            unelevated
            no-caps
            color="primary"
            label="Add task"
            :loading="adding"
            :disable="!newTitle.trim()"
            @click="addTodo"
          />
        </template>
      </q-input>

      <!-- status tabs -->
      <q-tabs
        v-model="todos.filters.status"
        dense
        no-caps
        align="left"
        class="q-mt-md"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab name="all" label="All" />
        <q-tab name="active" label="Active" />
        <q-tab name="completed" label="Completed" />
      </q-tabs>

      <!-- search, priority, sort -->
      <div class="row q-col-gutter-sm q-mt-xs">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="todos.filters.search"
            dense
            outlined
            clearable
            debounce="400"
            placeholder="Search titles and notes"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-6 col-sm-3">
          <q-select
            v-model="todos.filters.priority"
            dense
            outlined
            clearable
            emit-value
            map-options
            label="Priority"
            :options="priorityOptions"
          />
        </div>
        <div class="col-6 col-sm-3">
          <q-select
            v-model="todos.filters.sort"
            dense
            outlined
            emit-value
            map-options
            label="Sort by"
            :options="sortOptions"
          />
        </div>
      </div>

      <!-- the tag filter, shown after you click a tag on a task -->
      <div v-if="todos.filters.tag" class="q-mt-sm">
        <q-chip
          removable
          color="primary"
          text-color="white"
          icon="sell"
          @remove="todos.filters.tag = null"
        >
          {{ todos.filters.tag }}
        </q-chip>
      </div>

      <!-- the list -->
      <q-card flat bordered class="list-card q-mt-md">
        <q-list separator>
          <TodoItem
            v-for="todo in todos.items"
            :key="todo.id"
            :todo="todo"
            @toggle="toggle"
            @edit="openEdit"
            @delete="confirmDelete"
            @filter-tag="setTag"
          />
        </q-list>

        <div v-if="!todos.items.length && !todos.loading" class="text-center q-pa-xl">
          <q-icon name="inbox" size="44px" />
          <div class="q-mt-sm">
            {{ hasFilters ? 'No tasks match these filters.' : 'No tasks yet. Add your first one above.' }}
          </div>
          <q-btn
            v-if="hasFilters"
            flat
            no-caps
            color="primary"
            class="q-mt-sm"
            label="Clear filters"
            @click="clearFilters"
          />
        </div>

        <q-inner-loading :showing="todos.loading" />
      </q-card>

      <!-- how many tasks, and the page buttons -->
      <div v-if="todos.meta.total > 0" class="text-caption text-center q-mt-sm">
        {{ todos.meta.total }} {{ todos.meta.total === 1 ? 'task' : 'tasks' }}
        <template v-if="todos.meta.totalPages > 1">
          · page {{ todos.meta.page }} of {{ todos.meta.totalPages }}
        </template>
      </div>

      <div v-if="todos.meta.totalPages > 1" class="flex flex-center q-mt-sm">
        <q-pagination
          v-model="todos.filters.page"
          color="primary"
          direction-links
          boundary-links
          :max="todos.meta.totalPages"
          :max-pages="6"
        />
      </div>

      <div v-if="todos.stats.completed > 0" class="q-mt-md">
        <q-btn
          flat
          no-caps
          color="negative"
          icon="delete_sweep"
          label="Clear completed"
          @click="confirmClear"
        />
      </div>
    </div>

    <!-- the create / edit form -->
    <TodoFormDialog v-model="dialogOpen" :todo="editing" :loading="saving" @save="onSave" />
  </q-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import TodoFormDialog from '../components/TodoFormDialog.vue';
import TodoItem from '../components/TodoItem.vue';
import { useTodosStore } from '../stores/todos';
import { getErrorMessage } from '../utils/http';

const $q = useQuasar();
const todos = useTodosStore();

const priorityOptions = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const sortOptions = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Due soonest', value: 'due' },
];

const statCards = computed(() => [
  { label: 'Total', value: todos.stats.total, tone: '' },
  { label: 'Active', value: todos.stats.active, tone: 'text-primary' },
  { label: 'Done', value: todos.stats.completed, tone: 'text-positive' },
]);

// Is any filter switched on?
const hasFilters = computed(() => {
  const f = todos.filters;
  return f.status !== 'all' || !!f.priority || !!f.tag || !!(f.search ?? '').trim();
});

// Runs an action, shows a pop-up message, and answers true (worked) or false (failed)
async function run(action, successMessage) {
  try {
    await action();
    if (successMessage) $q.notify({ type: 'positive', message: successMessage });
    return true;
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err) });
    return false;
  }
}

// Load the tasks when the page appears, and clear them when it goes away (sign out)
onMounted(() => run(() => todos.refresh()));
onUnmounted(() => todos.reset());

// --- reload the list whenever a filter changes ---
// Changing the status, priority, tag, search or sort starts again from page 1.
// (If we are on another page, setting page = 1 triggers the page watcher below.)
watch(
  () => [
    todos.filters.status,
    todos.filters.priority,
    todos.filters.tag,
    todos.filters.search,
    todos.filters.sort,
  ],
  () => {
    if (todos.filters.page !== 1) todos.filters.page = 1;
    else run(() => todos.fetchTodos());
  },
);

// Moving to another page
watch(
  () => todos.filters.page,
  () => run(() => todos.fetchTodos()),
);

const setTag = (tag) => {
  todos.filters.tag = tag;
};

function clearFilters() {
  Object.assign(todos.filters, {
    status: 'all',
    priority: null,
    tag: null,
    search: '',
    sort: 'newest',
  });
}

// --- quick add (title only) ---
const newTitle = ref('');
const adding = ref(false);

async function addTodo() {
  const title = newTitle.value.trim();
  if (!title || adding.value) return;

  adding.value = true;
  const ok = await run(() => todos.createTodo({ title }), 'Task added');
  if (ok) newTitle.value = '';
  adding.value = false;
}

// --- the form dialog: one dialog for both creating and editing ---
const dialogOpen = ref(false);
const editing = ref(null); // null = creating a new task, a todo = editing that task
const saving = ref(false);

function openCreate() {
  editing.value = null;
  dialogOpen.value = true;
}

function openEdit(todo) {
  editing.value = todo;
  dialogOpen.value = true;
}

// The dialog gives us the form data. We decide what to do with it.
async function onSave(payload) {
  saving.value = true;
  const isEdit = editing.value !== null;
  const ok = await run(
    () => (isEdit ? todos.updateTodo(editing.value.id, payload) : todos.createTodo(payload)),
    isEdit ? 'Changes saved' : 'Task added',
  );
  saving.value = false;
  if (ok) dialogOpen.value = false; // if it failed, the dialog stays open so nothing is lost
}

// --- tick / untick ---
const toggle = (todo) => run(() => todos.toggleTodo(todo));

// --- delete, after asking ---
function confirmDelete(todo) {
  $q.dialog({
    title: 'Delete this task?',
    message: `“${todo.title}” will be permanently removed.`,
    persistent: true,
    cancel: { flat: true, noCaps: true, label: 'Keep it' },
    ok: { flat: true, noCaps: true, color: 'negative', label: 'Delete task' },
  }).onOk(() => run(() => todos.removeTodo(todo.id), 'Task deleted'));
}

// --- delete every finished task, after asking ---
function confirmClear() {
  const count = todos.stats.completed;
  $q.dialog({
    title: 'Clear completed tasks?',
    message: `This permanently deletes ${count} completed ${count === 1 ? 'task' : 'tasks'}.`,
    persistent: true,
    cancel: { flat: true, noCaps: true, label: 'Keep them' },
    ok: { flat: true, noCaps: true, color: 'negative', label: 'Clear completed' },
  }).onOk(() => run(() => todos.clearCompleted(), 'Completed tasks cleared'));
}
</script>

<style scoped>
.page-container {
  max-width: 760px;
  margin: 0 auto;
}

.stat-card {
  padding: 12px 8px;
  text-align: center;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.list-card {
  min-height: 96px;
}
</style>