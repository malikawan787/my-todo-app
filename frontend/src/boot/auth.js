import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';

export default ({ router, store }) => {
  const auth = useAuthStore(store);

  // The bouncer: pages marked requiresAuth need a signed-in user,
  // pages marked guestOnly (sign in / sign up) are skipped once you are signed in.
  router.beforeEach((to) => {
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'login' };
    }
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return { name: 'todos' };
    }
  });

  // If the API rejects our token (expired or fake), sign out and go to the sign-in page.
  // A wrong password also gives 401, but then we are not signed in yet, so it is ignored here.
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && auth.isAuthenticated) {
        auth.logout();
        router.push({ name: 'login', query: { expired: '1' } });
      }
      return Promise.reject(error);
    },
  );
};