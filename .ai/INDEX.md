# Índice de contexto

Este archivo es el punto de entrada para agentes y colaboradores. No leas todas las secciones: elige la que corresponde a la tarea.

| Sección | Cuándo leerla | Entrada |
| --- | --- | --- |
| Producto | Objetivo, usuarios, alcance o criterios de éxito | [`references/product/INDEX.md`](references/product/INDEX.md) |
| Juego | Reglas, simulación, interfaz o plataforma | [`references/game/INDEX.md`](references/game/INDEX.md) |
| Comunidad | Misiones, prompts, Jev, feedback, votación o A/B/C | [`references/community/INDEX.md`](references/community/INDEX.md) |
| Arquitectura | Componentes, contratos, datos, integraciones o seguridad | [`references/architecture/INDEX.md`](references/architecture/INDEX.md) |
| Operaciones | Analítica, errores, despliegue, monitoreo o rollback | [`references/operations/INDEX.md`](references/operations/INDEX.md) |
| ADRs | Razones de decisiones difíciles de revertir | [`adr/INDEX.md`](adr/INDEX.md) |
| Iniciativas | Trabajo temporal, estado y artefactos en curso | [`runs/INDEX.md`](runs/INDEX.md) |

## Estado actual

- Product Brief: aprobado y versionado.
- Arquitectura del juego: stack y baseline técnico implementados; la evolución funcional continúa por misiones.
- Experimento comunitario: Misiones 1 y 2 cerradas; Misión 3 aprobada y en preparación operativa para abrir el 30 de octubre de 2026 con el flujo de forks y PRs.
- Implementación: `metro_a`, `metro_b` y `metro_c` contienen los resultados de Misión 2 y quedan congeladas. `dev` conserva el juego de la versión B (`p-026`) e incorpora la infraestructura de Misión 3; su baseline congelado es `1c60eea3b88962768dae0501e2cc9b8f20041b29`.
