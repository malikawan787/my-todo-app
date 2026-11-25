<template>
  <q-item>
    <q-item-section side top>
      <q-checkbox
        :model-value="todo.completed"
        color="primary"
        :aria-label="todo.completed ? 'Mark as not done' : 'Mark as done'"
        @update:model-value="emit('toggle', todo)"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label class="text-body1" :class="{ 'text-strike text-grey-6': todo.completed }">
        {{ todo.title }}
      </q-item-label>

      <q-item-label v-if="todo.description" caption lines="2">
        {{ todo.description }}
      </q-item-label>

      <div class="row items-center q-gutter-xs q-mt-xs">
        <q-badge outline :color="priorityColor" :label="todo.priority" />

        <span v-if="dueLabel" class="text-caption" :class="dueClass">
          <q-icon name="event" size="14px" class="q-mr-xs" />{{ dueLabel }}{{ isOverdue ? ' (overdue)' : '' }}
        </span>

        <!-- clicking a tag asks the page to show only tasks with that tag -->
        <q-chip
          v-for="tag in todo.tags"
          :key="tag"
          clickable
          dense
          outline
          size="sm"
          color="primary"
          @click="emit('filter-tag', tag)"
        >
          #{{ tag }}
          <q-tooltip>Show only #{{ tag }}</q-tooltip>
        </q-chip>
      </div>
    </q-item-section>

    <q-item-section side top>
      <div class="row no-wrap">
        <q-btn
          flat
          round
          dense
          size="sm"
          icon="edit"
          aria-label="Edit task"
          @click="emit('edit', todo)"
        >
          <q-tooltip>Edit</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          dense
          size="sm"
          icon="delete"
          color="negative"
          aria-label="Delete task"
          @click="emit('delete', todo)"
        >
          <q-tooltip>Delete</q-tooltip>
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup>
import { computed } from 'vue';

// Props down: the page gives us a todo
const props = defineProps({
  todo: { type: Object, required: true },
});

// Events up: we tell the page what the user did
const emit = defineEmits(['toggle', 'edit', 'delete', 'filter-tag']);

const PRIORITY_COLORS = { low: 'blue-grey', medium: 'orange-9', high: 'negative' };
const priorityColor = computed(() => PRIORITY_COLORS[props.todo.priority] ?? 'grey');

// A due date is a plain day. The API sends "2026-12-31T00:00:00.000Z",
// so its first 10 characters are the day the user picked.
const dueDay = computed(() => (props.todo.dueDate ? props.todo.dueDate.slice(0, 10) : null));

// Today's date on THIS computer, as "YYYY-MM-DD"
function todayLocal() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Overdue = not finished, and the due day is before today (text dates compare correctly)
const isOverdue = computed(
  () => !props.todo.completed && dueDay.value !== null && dueDay.value < todayLocal(),
);

const dueLabel = computed(() =>
  dueDay.value
    ? new Date(`${dueDay.value}T00:00:00Z`).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '',
);

const dueClass = computed(() =>
  isOverdue.value ? 'text-negative text-weight-medium' : 'text-grey-7',
);
</script>