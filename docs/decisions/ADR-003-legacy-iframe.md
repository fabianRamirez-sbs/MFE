# ADR-003: iframe como estrategia de integración del Legacy Vue 2

**Estado:** Aceptado (temporal — revisar en Q3 2026)  
**Fecha:** 2026-04-28

## Contexto

El proyecto Vue 2 existente es grande y no puede migrarse de inmediato. Necesitamos que
coexista con la nueva plataforma MFE sin bloquear el desarrollo de nuevos módulos.

## Decisión

Integrar el legacy mediante **iframe** con un protocolo `postMessage` tipado (`IframeBridge`).

## Ventajas

- **Cero cambios al código Vue 2**: solo añadir `LegacyAppBridge.js` como entry point
- **Aislamiento total de CSS**: los estilos del legacy no contaminan el Shell
- **Aislamiento de JS**: errores en el legacy no rompen el Shell
- **Migración incremental**: los módulos Vue 2 se pueden reemplazar por Vue 3 uno a uno

## Desventajas y mitigaciones

| Desventaja | Mitigación |
|------------|------------|
| UX degradada (scroll dentro de scroll) | Usar `height: 100vh` en el iframe y deshabilitar scroll del wrapper |
| Comunicación limitada | `IframeBridge` con protocolo tipado cubre los casos de uso necesarios |
| SEO | No aplica (app bancaria, requiere autenticación) |
| Deep linking | El Shell pasa la sub-ruta como query param al iframe |

## Criterios para retirar este ADR

Cuando el módulo legacy haya sido completamente migrado a Vue 3 y el `LegacyMfeWrapper.vue`
ya no tenga rutas registradas en el router del Shell.
