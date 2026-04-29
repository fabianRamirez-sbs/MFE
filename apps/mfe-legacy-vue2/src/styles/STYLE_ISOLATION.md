/**
 * Guía de coexistencia de estilos Vue 2 + Vue 3
 *
 * PROBLEMA: El CSS global del legacy puede "escaparse" al Shell y viceversa.
 *
 * SOLUCIONES implementadas:
 *
 * 1. IFRAME (Opción A): aislamiento total de CSS — el más seguro.
 *    El CSS del legacy nunca toca el Shell.
 *
 * 2. CSS Scoping (Opción B — Module Federation):
 *    - Todos los selectores del legacy deben vivir bajo un wrapper CSS:
 *      .legacy-scope { ... todos los estilos del legacy ... }
 *    - En el index.html del legacy agregar el wrapper:
 *      <div id="legacy-app" class="legacy-scope">
 *
 * 3. CSS Custom Properties:
 *    - El Shell define las variables CSS en :root
 *    - El legacy las PUEDE leer si son compatibles
 *    - Pero el legacy NO puede sobreescribir :root (o contaminaría el Shell)
 *
 * 4. Shadow DOM (opcional, avanzado):
 *    - Encapsular el legacy en un Web Component con Shadow DOM
 *    - Máximo aislamiento, pero requiere más trabajo de integración
 */

/*
  Wrapper de aislamiento para el legacy (aplicar en index.html del legacy):

  .legacy-scope {
    all: initial;           ← reset de herencia del Shell
    font-family: inherit;   ← permitir heredar la fuente del Shell
    color: inherit;
    contain: layout style;  ← CSS Containment para performance
  }
*/
