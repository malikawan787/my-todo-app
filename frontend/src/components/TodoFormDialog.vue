<template>
    <q-dialog v-model="open">
      <q-card class="todo-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isEdit ? 'Edit task' : 'New task' }}</div>
          <q-space />
          <q-btn flat round dense icon="close" aria-label="Close" @click="open = false" />
        </q-card-section>
  
        <q-form @submit="submit">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="form.title"
              outlined
              autofocus
              label="Title"
              maxlength="200"
              lazy-rules
              :rules="[(v) => !!v?.trim() || 'Give the task a title']"
            />
  
            <q-input
              v-model="form.description"
              outlined
              autogrow
              type="textarea"
              label="Notes (optional)"
              maxlength="2000"
            />
  
            <div class="row">
              <div class="col-12 col-sm-6 q-pr-md">
                <q-select
                  v-model="form.priority"
                  outlined
                  emit-value
                  map-options
                  label="Priority"
                  :options="priorityOptions"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.dueDate"
                  outlined
                  clearable
                  stack-label
                  type="date"
                  label="Due date"
                />
              </div>
            </div>
  
            <q-select
              v-model="form.tags"
              outlined
              multiple
              use-input
              use-chips
              hide-dropdown-icon
              input-debounce="0"
              new-value-mode="add-unique"
              label="Tags"
              hint="Type a tag and press Enter"
            />
          </q-card-section>
  
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat no-caps label="Cancel" @click="open = false" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              :loading="loading"
              :label="isEdit ? 'Save changes' : 'Add task'"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </template>
  
  <script setup>
  import { computed, reactive, watch } from 'vue';
  
  const props = defineProps({
    modelValue: { type: Boolean, default: false }, // is the dialog open?
    todo: { type: Object, default: null }, // null = creating, a todo = editing
    loading: { type: Boolean, default: false },
  });
  const emit = defineEmits(['update:modelValue', 'save']);
  
  // Lets the page use v-model on this component
  const open = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
  });
  
  const isEdit = computed(() => props.todo !== null);
  
  const priorityOptions = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];
  
  const blankForm = () => ({ title: '', description: '', priority: 'medium', dueDate: null, tags: [] });
  const form = reactive(blankForm());
  
  // Each time the dialog opens, fill the form: from the todo being edited, or empty
  watch(
    () => props.modelValue,
    (isOpen) => {
      if (!isOpen) return;
      Object.assign(
        form,
        props.todo
          ? {
              title: props.todo.title,
              description: props.todo.description ?? '',
              priority: props.todo.priority,
              // The API sends "2026-12-31T00:00:00.000Z". A date box wants "2026-12-31".
              dueDate: props.todo.dueDate ? props.todo.dueDate.slice(0, 10) : null,
              tags: [...(props.todo.tags ?? [])],
            }
          : blankForm(),
      );
    },
  );
  
  function submit() {
    emit('save', {
      title: form.title.trim(),
      description: (form.description ?? '').trim(),
      priority: form.priority,
      dueDate: form.dueDate || null, // empty means "no due date"
      tags: form.tags ?? [],
    });
  }
  </script>
  
  <style scoped>
  .todo-dialog {
    width: 520px;
    max-width: 95vw;
  }
  </style>