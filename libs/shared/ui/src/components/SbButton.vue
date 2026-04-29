<script setup lang="ts">
/**
 * SbButton — Botón base del Design System
 *
 * Componente de ejemplo que ilustra el patrón de componentes compartidos.
 * Todos los componentes del DS siguen el prefijo "Sb" (SipaBanca).
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

defineProps<{
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    :class="[
      'sb-button',
      `sb-button--${variant ?? 'primary'}`,
      `sb-button--${size ?? 'md'}`,
      { 'sb-button--loading': loading },
    ]"
    :disabled="disabled || loading"
    :type="type ?? 'button'"
    v-bind="$attrs"
  >
    <span v-if="loading" class="sb-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use '../styles/tokens' as *;

.sb-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-2;
  border: 1px solid transparent;
  border-radius: $border-radius;
  font-family: $font-family-base;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease, box-shadow 150ms ease;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &--primary {
    background-color: var(--color-primary);
    color: #fff;
    &:hover:not(:disabled) { background-color: var(--color-primary-hover); }
  }

  &--secondary {
    background-color: transparent;
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &--ghost {
    background-color: transparent;
    color: var(--color-text-primary);
    &:hover:not(:disabled) { background-color: var(--color-border); }
  }

  &--danger {
    background-color: var(--color-danger);
    color: #fff;
  }

  &--sm { padding: $spacing-1 $spacing-3; font-size: $font-size-sm; }
  &--md { padding: $spacing-2 $spacing-4; font-size: $font-size-base; }
  &--lg { padding: $spacing-3 $spacing-6; font-size: $font-size-lg; }

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &__spinner {
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
}
</style>
