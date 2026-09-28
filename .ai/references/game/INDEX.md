# Juego — índice y guía de contexto

## Cuándo usar esta sección

Lee esta sección para reglas de partida, simulación, demanda, interfaz, accesibilidad, plataforma o datos del juego.

## Orden de lectura

1. Secciones 3 a 8 del [Product Brief](../../../docs/superpowers/specs/2026-09-27-metro-app-product-brief-design.md).
2. [ADR-0004](../../adr/0004-universal-game-client-with-expo.md) para el stack del cliente y el límite de la simulación.
3. [`technical-baseline.md`](technical-baseline.md) para crear o revisar el punto de partida de las variantes.
4. [Mapa de arquitectura](../architecture/system-map.md) para conocer los límites con comunidad y telemetría.
5. [Contexto operativo](../operations/INDEX.md) cuando el cambio produce eventos, errores o datos de sesión.

## Skills relacionados

- `superpowers:brainstorming`: nuevas mecánicas o cambios de experiencia.
- `superpowers:writing-plans`: planificación posterior a una especificación aprobada.
- `superpowers:test-driven-development`: motor determinista, rutas, capacidad y reglas de victoria o derrota.
- `superpowers:verification-before-completion`: antes de declarar jugable una entrega.
- `ponytail:ponytail`: mantener el MVP sin dependencias o abstracciones especulativas.

## Estado

Las reglas jugables y la dirección visual están aprobadas. El cliente usará Expo, React Native Web, TypeScript y `react-native-svg`; el motor de simulación será TypeScript puro y permanecerá separado de la interfaz.

La definición y creación de un baseline técnico neutral preceden a la redacción de la Misión 1. Ese baseline debe permitir ejecutar, validar y desplegar las variantes bajo las mismas condiciones sin resolver por adelantado la mecánica que se encargue a la comunidad.

El contenido exacto del baseline está aprobado y documentado en [`technical-baseline.md`](technical-baseline.md). Su implementación todavía no ha comenzado.
