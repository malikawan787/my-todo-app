import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api, TOKEN_KEY } from '../api/client';

const USER_KEY = 'todo_user';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  // On page load, pick up a previous session from the browser's storage
  const token = ref(localStorage.getItem(TOKEN_KEY));
  const user = ref(readStoredUser());
  const isAuthenticated = computed(() => Boolean(token.value));

  function saveSession(session) {
    token.value = session.token;
    user.value = session.user;
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    saveSession(data.data);
  }

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload);
    saveSession(data.data);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return { token, user, isAuthenticated, register, login, logout };
});