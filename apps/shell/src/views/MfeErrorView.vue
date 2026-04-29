<template>
  <div class="mfe-error">
    <h2>Módulo no disponible</h2>
    <p>No se pudo conectar con el servidor del módulo remoto.</p>
    <p class="mfe-error__hint">Asegúrate de que el servidor del MFE está corriendo.</p>
  </div>
</template>

<style scoped lang="scss">
.mfe-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.5rem;
  color: var(--color-text-secondary, #6b7280);

  h2 { font-size: 1.5rem; font-weight: 600; margin: 0; color: var(--color-danger, #ef4444); }
  p  { margin: 0; }

  &__hint {
    font-size: 0.875rem;
    background: var(--color-surface, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 6px;
    padding: 0.5rem 1rem;
    margin-top: 0.5rem;
  }
}
</style>
