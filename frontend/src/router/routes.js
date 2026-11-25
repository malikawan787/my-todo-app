// meta.requiresAuth and meta.guestOnly are read by the bouncer in boot/auth.js
const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [{ path: '', name: 'todos', component: () => import('../pages/TodosPAge.vue') }],
  },
  {
    path: '/auth',
    component: () => import('../layouts/AuthLayout.vue'),
    meta: { guestOnly: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('../pages/AuthPage.vue'),
        props: { mode: 'login' },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('../pages/AuthPage.vue'),
        props: { mode: 'register' },
      },
    ],
  },

  // Always keep this last
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue'),
  },
];

export default routes;