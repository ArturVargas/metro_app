# Operaciones — índice y guía de contexto

## Cuándo usar esta sección

Lee esta sección para eventos de producto, errores, alertas, privacidad, despliegues, previews, costos, rollback o incidentes.

## Orden de lectura

1. [`telemetry.md`](telemetry.md) para requisitos confirmados y decisiones abiertas.
2. [`cloudflare-deployments.md`](cloudflare-deployments.md) para publicar Base o una variante A/B/C.
3. [`github-community-writer.md`](github-community-writer.md) para credenciales, permisos y pruebas de persistencia en Issues.
4. [ADR-0005](../../adr/0005-cloudflare-abc-preview-slots.md) para las cuatro ranuras estables y la promoción manual al baseline.
5. [Mapa de arquitectura](../architecture/system-map.md) para saber qué componente emite cada señal.
6. [`standards/observability.md`](../../../standards/observability.md) y [`standards/release-readiness.md`](../../../standards/release-readiness.md) antes de liberar.

## Skills relacionados

- `superpowers:verification-before-completion`: evidencia fresca antes de afirmar que una entrega funciona.
- `superpowers:systematic-debugging`: investigación de errores y regresiones.
- `architecture-workflow`: cambios en proveedores, datos operativos o límites de responsabilidad.

## Regla de privacidad

No envíes prompts, números telefónicos ni identificadores directos a herramientas de analítica o errores. Define explícitamente el esquema de eventos antes de instrumentar.
