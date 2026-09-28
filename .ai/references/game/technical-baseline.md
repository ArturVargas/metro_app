# Baseline técnico del cliente

## Cómo usar este documento

Usa esta referencia al crear o modificar el punto de partida común de las variantes A/B/C. El baseline prepara el proyecto y muestra el estado inicial de la primera misión; no implementa la solución que competirá en esa misión.

Para decisiones de plataforma lee primero [ADR-0004](../../adr/0004-universal-game-client-with-expo.md). Para cambios de alcance vuelve al [Product Brief](../../../docs/superpowers/specs/2026-09-27-metro-app-product-brief-design.md).

## Contenido aprobado

- Workspace raíz administrado con `pnpm`, preparado para `apps/` y `packages/`.
- Aplicación `apps/game` con Expo, React Native Web, TypeScript y `react-native-svg`.
- Una pantalla adaptable con un tablero SVG y las ocho estaciones fijas.
- Las estaciones son visibles y tienen nombres accesibles, pero todavía no son interactivas.
- Exportación web estática.
- Comandos compartidos para desarrollo web, lint, tipos y build.
- GitHub Actions ejecuta lint, tipos y build en cada pull request.

## Fuera del baseline

- Creación o edición de líneas.
- Trenes, pasajeros, demanda o simulación.
- Dirección visual definitiva o sistema de diseño.
- PostHog y proveedor de observabilidad.
- Backend comunitario, Jev, LLM, Hermes o automatización A/B/C.
- Servicio definitivo para publicar previews.

## Criterios de aceptación

- Una instalación limpia desde el lockfile permite ejecutar los comandos compartidos.
- La aplicación abre en navegador y muestra exactamente ocho estaciones dentro del tablero.
- El tablero no se desborda ni oculta estaciones en tamaños representativos de móvil y escritorio.
- Las estaciones se distinguen como círculos, triángulos o cuadrados y exponen un nombre accesible.
- La pantalla no permite todavía crear líneas ni contiene mecánicas del juego.
- Lint, comprobación de tipos y exportación web terminan correctamente localmente y en CI.

## Verificación proporcional

Este baseline no contiene reglas de negocio ni cálculos. Se verifica mediante lint, tipos, build web y revisión visual en móvil y escritorio. Las reglas del motor de simulación y las interacciones de misiones posteriores usarán pruebas automatizadas antes de su implementación.

## Skills relacionados

- `architecture-workflow`: cambios de stack, límites o estructura del repositorio.
- `ponytail:ponytail`: evitar dependencias y abstracciones anticipadas.
- `superpowers:writing-plans`: convertir este alcance en tareas ejecutables.
- `superpowers:verification-before-completion`: registrar evidencia antes de declarar listo el baseline.
