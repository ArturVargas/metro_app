# Calibración TypeSafe — Misión 3 (pasajeros en espera) — resumen — 2026-10-26

- **Veredicto vigente: `ready` con `rubric-m3-v2`.** El caso fuerte califica en 13 de 13 corridas (81.9–84.4, media 83.3, desviación estándar 0.9); débil, medio y la variante con una desviación quedan en 0 por `core-gap`. Margen mínimo sobre 80: 1.9 puntos. Ver [`rubric-m3-v2`](#puntaje-continuo-y-rubric-m3-v2).
- **Veredicto inicial (`rubric-m3-v1`, total redondeado): `not ready`.** El caso fuerte calificó en 1 de 3 corridas (80.0, 80.0, 87.5). Las secciones "Resultados" a "Veredicto" registran esa primera calibración.
- **Rúbrica:** primero `rubric-m3-v1` + `m3-policy`; después `rubric-m3-v2` (igual que `rubric-m3-v1` salvo el descriptor de fidelidad; puntaje continuo y `core-gap` por probabilidad, de la rama `feat/m3-continuous-scoring`). **Modelo:** `jev-1.14.0`. Umbral (> 80) y alcance sin cambios.
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

`not ready` con `rubric-m3-v1`. No se cambió el umbral ni el alcance. Ese veredicto lo reemplaza el de `rubric-m3-v2`, más abajo.

## Puntaje continuo y `rubric-m3-v2`

Rama `feat/m3-continuous-scoring`. Mismo umbral (> 80), misma escala 0–4 y mismos casos, con diff ampliado a ±25 líneas de contexto. El total usa el valor esperado de cada dimensión y `core-gap` se activa si la probabilidad de niveles 0–2 en cobertura o fidelidad es ≥ 0.6. `rubric-m3-v2` solo cambia el descriptor de fidelidad. Sin `--record`.

Niveles esperados: cobertura / fidelidad / alcance / evidencia / trazabilidad. "P≤2" es la probabilidad de niveles 0–2 en cobertura y fidelidad.

| Rúbrica | Caso | Corrida | Rúbrica | Final | Niveles esperados | P≤2 cob / fid | Califica |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| v1 continuo | Fuerte v2 | 1–3 | 80.9 / 81.9 / 79.4 | igual | fidelidad ≈ 2.55 | — / 0.47 | 2 de 3 |
| v1 continuo | Débil | 1 | — | 0 | — | 0.71 / 0.97 | no (`core-gap`) |
| v1 continuo | Medio | 1 | — | 0 | — | 0.30 / 0.94 | no (`core-gap`) |
| v2 iter. 1 | Fuerte v2 | 1 | 83.8 | 83.8 | 3.49/3.04/3.77/3.19/3.12 | 0.10 / 0.30 | **sí** |
| v2 iter. 1 | Fuerte v2 | 2 | 83.9 | 83.9 | 3.46/3.01/3.79/3.25/3.19 | 0.09 / 0.33 | **sí** |
| v2 iter. 1 | Fuerte v2 | 3 | 83.7 | 83.7 | 3.49/3.03/3.78/3.19/3.09 | 0.09 / 0.31 | **sí** |
| v2 iter. 1 | Débil | 1 | 43.8 | 0 | 1.70/1.72/2.26/0.65/2.62 | 0.81 / 0.80 | no (`core-gap`) |
| v2 iter. 1 | Medio | 1 | 60.3 | 0 | 2.61/1.74/2.94/2.01/3.06 | 0.46 / 0.94 | no (`core-gap`) |

Con `rubric-m3-v2` se cumple el criterio: fuerte elegible 3 de 3, débil y medio en 0. Se hizo una sola iteración del descriptor. El margen del fuerte sobre el umbral es de unos 4 puntos.

### `rubric-m3-v2`: corridas adicionales (10:32–10:40)

Commit b678bef, ±25 líneas de contexto, sin `--record`. "Fuerte con desviación" es el caso fuerte con un solo valor principal de un requisito cambiado en el diff (fixture privado).

| Caso | Corrida | Rúbrica | Final | Niveles esperados | P≤2 cob / fid | Califica |
| --- | --- | ---: | ---: | --- | --- | --- |
| Fuerte v2 | 4 | 83.6 | 83.6 | 3.50/3.05/3.79/3.20/2.95 | 0.07 / 0.32 | sí |
| Fuerte v2 | 5 | 84.1 | 84.1 | 3.50/3.04/3.78/3.25/3.10 | 0.09 / 0.32 | sí |
| Fuerte v2 | 6 | 82.2 | 82.2 | 3.46/2.90/3.76/3.18/2.97 | 0.09 / 0.37 | sí |
| Fuerte v2 | 7 | 84.3 | 84.3 | 3.49/3.02/3.79/3.31/3.16 | 0.09 / 0.32 | sí |
| Fuerte v2 | 8 | 81.9 | 81.9 | 3.42/2.90/3.75/3.19/2.97 | 0.10 / 0.37 | sí |
| Fuerte v2 | 9 | 84.4 | 84.4 | 3.51/3.06/3.79/3.24/3.12 | 0.09 / 0.32 | sí |
| Fuerte v2 | 10 | 82.5 | 82.5 | 3.46/2.91/3.78/3.18/3.01 | 0.09 / 0.36 | sí |
| Fuerte v2 | 11 | 83.9 | 83.9 | 3.50/3.00/3.78/3.23/3.14 | 0.09 / 0.34 | sí |
| Fuerte v2 | 12 | 81.9 | 81.9 | 3.39/2.85/3.75/3.21/3.13 | 0.12 / 0.39 | sí |
| Fuerte v2 | 13 | 83.0 | 83.0 | 3.45/3.02/3.78/3.18/2.97 | 0.10 / 0.32 | sí |
| Débil | 1 | 45.8 | 0 | 1.90/1.75/2.38/0.61/2.59 | 0.75 / 0.79 | no (`core-gap`) |
| Débil | 2 | 44.3 | 0 | 1.81/1.68/2.29/0.62/2.59 | 0.77 / 0.80 | no (`core-gap`) |
| Débil | 3 | 44.6 | 0 | 1.93/1.63/2.27/0.62/2.50 | 0.74 / 0.83 | no (`core-gap`) |
| Medio | 1 | 57.6 | 0 | 2.52/1.64/2.71/2.01/2.96 | 0.53 / 0.95 | no (`core-gap`) |
| Medio | 2 | 60.3 | 0 | 2.61/1.75/2.83/2.01/3.25 | 0.47 / 0.91 | no (`core-gap`) |
| Medio | 3 | 61.3 | 0 | 2.67/1.79/2.93/2.02/3.16 | 0.41 / 0.92 | no (`core-gap`) |
| Fuerte con desviación | 1 | 58.9 | 0 | 2.55/1.50/3.38/2.22/2.07 | 0.46 / 0.99 | no (`core-gap`) |
| Fuerte con desviación | 2 | 61.0 | 0 | 2.67/1.80/3.31/2.20/1.99 | 0.38 / 0.97 | no (`core-gap`) |
| Fuerte con desviación | 3 | 61.5 | 0 | 2.72/1.62/3.29/2.21/2.48 | 0.31 / 0.99 | no (`core-gap`) |

Fuerte, 13 corridas (3 de la iteración 1 + 10): mínimo 81.9, máximo 84.4, media 83.3, desviación estándar 0.9; elegible en 13 de 13. Margen mínimo sobre 80: 1.9 puntos. Débil y medio quedan en 0 en todas las corridas. La variante con un valor cambiado queda en `core-gap` en 3 de 3: v2 sigue penalizando una desviación real.
