# Calibración TypeSafe — Misión 3 (pasajeros en espera) — resumen — 2026-10-26

- **Veredicto: `not ready`.** El caso fuerte califica en 1 de 3 corridas (80.0, 80.0, 87.5): la elegibilidad no es estable en el borde de 80.
- **Rúbrica:** `rubric-m3-v1` + `m3-policy`, sin cambios. **Modelo:** `jev-1.14.0`. Umbral, rúbrica y alcance sin cambios.
- **Persistencia:** desactivada (sin `--record`); no se escribió ningún intento en GitHub.
- **Material:** los fixtures, diffs y salidas completas son privados y viven solo en el VPS del equipo (`~/m3-calib/private/`). Este resumen no incluye código, diffs ni prompts porque revelarían una solución de la misión.

## Casos

Los tres casos son código real sobre `dev` `acd8258` que solo toca `apps/game/` y pasa lint y typecheck; el fuerte además pasa `build:web`.

| Caso | Descripción | Expectativa |
| --- | --- | --- |
| Débil | Prompt vago; el código solo dibuja un adorno fijo | `core-gap`, 0 |
| Medio | Prompt con las reglas del brief; el código no respeta pausa, límite ni reproducibilidad | `core-gap`, 0 |
| Fuerte v1 | Código que cumple todas las reglas; prompt en prosa y pruebas en lista | > 80 |
| Fuerte v2 | El mismo código; prompt con requisitos R1–R10 numerados y una prueba P1–P10 por requisito, más lint, typecheck y build | > 80 |

## Resultados

Niveles: cobertura / fidelidad / alcance / evidencia / trazabilidad. "Rúbrica" es el total antes de la política; "Final" es el que recibe el participante. Las horas están en America/Mexico_City (UTC-6).

| Caso | Corrida | Hora | Rúbrica | Final | Niveles | Hard-fails | Califica |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| Débil | 1–3 | 09:27 | 47.5 ×3 | 0 | 2/1/3/1/3 | core-gap | no |
| Medio | 1 | 09:27 | 51.3 | 0 | 2/1/3/2/3 | core-gap | no |
| Medio | 2–3 | 09:27 | 46.3 ×2 | 0 | 2/1/2/2/3 | core-gap | no |
| Fuerte v1 | 1–3 | 09:27 | 80.0 ×3 | 80.0 | 3/3/4/3/3 | — | no |
| Fuerte v2 | 1 | 09:39 | 80.0 | 80.0 | 3/3/4/3/3 | — | no |
| Fuerte v2 | 2 | 09:39 | 80.0 | 80.0 | 3/3/4/3/3 | — | no |
| Fuerte v2 | 3 | 09:39 | 87.5 | 87.5 | 4/3/4/3/3 | — | **sí** |
| Débil (control) | 1 | 09:39 | 45.0 | 0 | 2/1/3/1/2 | core-gap | no |
| Medio (control) | 1 | 09:39 | 51.3 | 0 | 2/1/3/2/3 | core-gap | no |

## Lectura

- Débil y medio quedan siempre en 0 por `core-gap`; la separación de los casos incompletos es estable.
- Con el prompt numerado, la cobertura del fuerte sube a 4 en una de tres corridas; fidelidad, evidencia y trazabilidad se quedan en 3. Con 3/3/4/3/3 el total es 80.0 exacto y no califica; con un solo nivel más en cualquier dimensión, califica.
- Jev reporta confianza baja (`l`) en fidelidad, evidencia y trazabilidad del caso fuerte, y media en cobertura y alcance. No da un motivo por requisito. El feedback es la plantilla `feedback-template-m3-v1`: en las corridas de 80 dice que "hay requisitos del prompt que el código no implementa" y que "el código hace algo distinto en algunos valores, condiciones o casos límite"; en la de 87.5 señala comportamiento y evidencia. En la revisión manual no se encontró un requisito sin implementar.
- El criterio del plan (sin cambios de elegibilidad entre corridas) no se cumple: el caso fuerte es elegible en 1 de 3.

## Veredicto

`not ready`. No se cambió el umbral, la rúbrica ni el alcance. La decisión queda para Artur.
