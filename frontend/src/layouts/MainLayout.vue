<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-primary text-white">
      <q-toolbar>
        <q-icon name="task_alt" size="sm" class="q-mr-sm" />
        <q-toolbar-title class="text-weight-bold">Taskly</q-toolbar-title>

        <span v-if="auth.user" class="gt-xs q-mr-sm text-body2">{{ auth.user.name }}</span>

        <q-btn
          flat
          round
          dense
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          :aria-label="themeLabel"
          @click="toggleDark"
        >
          <q-tooltip>{{ themeLabel }}</q-tooltip>
        </q-btn>

        <q-btn flat round dense icon="logout" aria-label="Sign out" @click="logout">
          <q-tooltip>Sign out</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { DARK_KEY } from '../boot/theme';
import { useAuthStore } from '../stores/auth';

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();

const themeLabel = computed(() =>
  $q.dark.isActive ? 'Switch to light mode' : 'Switch to dark mode',
);

// Flip between light and dark, and remember the choice for next time
function toggleDark() {
  $q.dark.toggle();
  localStorage.setItem(DARK_KEY, String($q.dark.isActive));
}

async function logout() {
  auth.logout();
  await router.push({ name: 'login' });
}
</script>