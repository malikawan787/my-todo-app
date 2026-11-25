<template>
  <div class="not-found column items-center justify-center text-center q-pa-lg">
    <div class="text-h1 text-weight-bold text-primary">404</div>
    <div class="text-h6 q-mt-sm">This page doesn’t exist</div>
    <q-btn
      class="q-mt-lg"
      color="primary"
      unelevated
      no-caps
      label="Back to my tasks"
      :to="{ name: 'todos' }"
    />
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
}
</style>