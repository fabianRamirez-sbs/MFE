# ADR-002: Pinia singleton como mecanismo de estado compartido

**Estado:** Aceptado  
**Fecha:** 2026-04-28

## Contexto

Los MFEs necesitan acceder a datos del usuario autenticado (token, perfil, roles) sin que el
Shell les inyecte props o use un sistema de publicación/suscripción complejo.

## Decisión

Usar **Pinia como singleton** vía Module Federation `shared: { pinia: { singleton: true } }`.

El Shell hidrata el store con `storeId = 'shell'`. Los MFEs definen el mismo store
en `@sipabanca/shared-state` y acceden a los mismos datos sin imports directos al Shell.

## Por qué NO usamos otras alternativas

- **Props drilling Shell → MFE**: requeriría que el Shell conozca los props de cada MFE (acoplamiento fuerte)
- **Custom Events / postMessage entre Vue apps**: verbose, sin tipado, difícil de debuggear
- **Zustand/Jotai**: cambio de ecosistema, incompatible con Vue
- **Context API de Vue (provide/inject)**: no funciona entre instancias de Vue separadas

## Invariante clave

El `storeId` `'shell'` es el contrato. No debe cambiar. Si se necesita renombrar,
crear un alias y deprecar el anterior con tiempo de migración.
