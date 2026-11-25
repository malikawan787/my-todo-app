<template>
    <q-page class="flex flex-center q-pa-md">
      <q-card flat bordered class="auth-card q-pa-md">
        <q-card-section class="text-center">
          <q-icon name="task_alt" color="primary" size="44px" />
          <div class="text-h5 text-weight-bold q-mt-sm">
            {{ isLogin ? 'Welcome back' : 'Create your account' }}
          </div>
          <div>
            {{ isLogin ? 'Sign in to see your tasks.' : 'Your tasks stay private to your account.' }}
          </div>
        </q-card-section>
  
        <q-form @submit="onSubmit">
          <q-banner v-if="expired" rounded class="bg-orange-2 text-orange-10 q-mb-md">
            Your session expired. Please sign in again.
          </q-banner>
  
          <q-input
            v-if="!isLogin"
            v-model="form.name"
            outlined
            label="Name"
            autocomplete="name"
            lazy-rules
            :rules="[required]"
          />
  
          <q-input
            v-model="form.email"
            outlined
            type="email"
            label="Email"
            autocomplete="email"
            lazy-rules
            :rules="[required, validEmail]"
          />
  
          <q-input
            v-model="form.password"
            outlined
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="isLogin ? 'current-password' : 'new-password'"
            lazy-rules
            :rules="passwordRules"
          >
            <template #append>
              <q-btn
                flat
                round
                dense
                :icon="showPassword ? 'visibility_off' : 'visibility'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
  
          <q-banner v-if="error" rounded class="bg-negative text-white">{{ error }}</q-banner>
  
          <q-btn
            type="submit"
            color="primary"
            unelevated
            no-caps
            size="lg"
            class="full-width"
            :loading="loading"
            :label="isLogin ? 'Sign in' : 'Create account'"
          />
        </q-form>
  
        <q-card-section class="text-center text-body2">
          <template v-if="isLogin">
            New here?
            <router-link :to="{ name: 'register' }" class="text-primary">Create an account</router-link>
          </template>
          <template v-else>
            Already have an account?
            <router-link :to="{ name: 'login' }" class="text-primary">Sign in</router-link>
          </template>
        </q-card-section>
      </q-card>
    </q-page>
  </template>
  
  <script setup>
  import { computed, reactive, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '../stores/auth';
  import { getErrorMessage } from '../utils/http';
  
  // "mode" is passed in from the route: 'login' or 'register'
  const props = defineProps({
    mode: { type: String, default: 'login' },
  });
  
  const route = useRoute();
  const router = useRouter();
  const auth = useAuthStore();
  
  const isLogin = computed(() => props.mode === 'login');
  const expired = computed(() => isLogin.value && route.query.expired === '1');
  
  const form = reactive({ name: '', email: '', password: '' });
  const showPassword = ref(false);
  const loading = ref(false);
  const error = ref('');
  
  // Switching between sign in and sign up clears the old error
  watch(
    () => props.mode,
    () => {
      error.value = '';
    },
  );
  
  // Each rule returns true when the value is fine, or a message when it is not
  const required = (value) => !!value?.trim() || 'This field is required';
  const validEmail = (value) => /^\S+@\S+\.\S+$/.test(value) || 'Enter a valid email address';
  const passwordRules = computed(() =>
    isLogin.value
      ? [required]
      : [required, (value) => value.length >= 8 || 'Use at least 8 characters'],
  );
  
  async function onSubmit() {
    error.value = '';
    loading.value = true;
    try {
      if (isLogin.value) {
        await auth.login({ email: form.email, password: form.password });
      } else {
        await auth.register({ name: form.name, email: form.email, password: form.password });
      }
      await router.replace({ name: 'todos' });
    } catch (err) {
      error.value = getErrorMessage(err);
    } finally {
      loading.value = false;
    }
  }
  </script>
  
  <style scoped>
  .auth-card {
    width: 100%;
    max-width: 400px;
  }
  </style>