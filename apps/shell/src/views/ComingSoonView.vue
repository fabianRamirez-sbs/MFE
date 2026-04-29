<template>
  <div class="coming-soon">
    <h2>Próximamente</h2>
    <p>Este módulo está en desarrollo y estará disponible próximamente.</p>
  </div>
</template>

<style scoped lang="scss">
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.5rem;
  color: var(--color-text-secondary, #6b7280);

  h2 { font-size: 1.5rem; font-weight: 600; margin: 0; }
  p  { margin: 0; }
}
</style>
