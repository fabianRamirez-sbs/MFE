# ADR-001: Module Federation como mecanismo de integración MFE

**Estado:** Aceptado  
**Fecha:** 2026-04-28  
**Decisores:** Arquitectura, Tech Leads

## Contexto

Necesitamos integrar múltiples frontends independientes (Vue 3) más un legacy (Vue 2) en una
sola experiencia de usuario. Las opciones evaluadas fueron:

1. **Module Federation (Vite)** — integración en runtime vía remoteEntry.js
2. **iframes puros** — máximo aislamiento, peor UX
3. **Single-SPA** — framework de orquestación MFE maduro
4. **Web Components** — estándar web, agnóstico de framework

## Decisión

Adoptamos **Module Federation** con `@originjs/vite-plugin-federation`.

## Razonamiento

| Criterio | MF | iframes | Single-SPA | Web Components |
|----------|----|---------|-----------|----------------|
| Compartir Vue/Pinia (singleton) | ✅ | ❌ | ✅ | ⚠️ |
| Aislamiento CSS | ⚠️ | ✅ | ⚠️ | ✅ |
| DX (developer experience) | ✅ | ❌ | ⚠️ | ⚠️ |
| Compatibilidad Vue 2+3 | ⚠️ | ✅ | ✅ | ✅ |
| Build independiente | ✅ | ✅ | ✅ | ✅ |

El legacy Vue 2 se integra vía iframe hasta que sea migrado (ver ADR-003).

## Consecuencias

- Los MFEs deben exponer los mismos `shared` en `vite.config.ts`
- Las versiones de Vue/Pinia deben ser compatibles entre Shell y remotes
- El `remoteEntry.js` debe ser accesible (CORS habilitado en los remotes)
