# Calibración TypeSafe — Misión 1 — rubric-m1-v2 — 2026-10-01

- **Estado:** completada
- **Misión:** `mission-m1`
- **Rúbrica:** `rubric-m1-v2` + hard-fail policy (ADR-0009)
- **Modelo solicitado:** `jev-latest`
- **Persistencia:** desactivada (`--record` no usado); no crea Issues ni comentarios
- **Feedback:** `FEEDBACK_MODE=stub` → `feedback-template-m1-v1`

## Objetivo

Comprobar que v2 + hard-fail ordena débil / medio / golden, mantiene débil y medio debajo de 70, y reconoce el golden Emily-style como elegible.

## Controles

| Control | Expectativa | Prompt |
| --- | --- | --- |
| Débil | &lt;70 + hard-fails | Haz que el tablero sea más divertido y conecta las estaciones de una manera bonita. |
| Medio | &lt;70; hard-fail por falta de verify web | Permite seleccionar dos estaciones y conectarlas con una línea visible. Conserva las ocho estaciones actuales. |
| Golden | ≥70; sin hard-fail | Implementa en el tablero actual la interacción para seleccionar dos de las ocho estaciones, con mouse y pantalla táctil, y conectarlas. Al completar la conexión debe verse una línea clara entre los centros de ambas estaciones. Conserva las posiciones e identidades de las ocho estaciones y el cliente universal Expo/web. No agregues pasajeros, demanda ni backend del juego. Termina cuando una persona pueda abrir el build web, seleccionar dos estaciones, ver la línea y repetir la prueba en menos de un minuto. |

Brief: [`public-brief.md`](public-brief.md).

## Resultados

| Control | Total | Elegible | Niveles V/A/E/L | Hard-fail | Enrutado | Tokens in/out |
| --- | ---: | --- | --- | --- | --- | ---: |
| Débil | 13.8 | No | 0 / 1 / 1 / 0 | missing-select-connect, missing-visible-line, missing-web-verify | `caution` | 1714 / 68 |
| Medio | 57.5 | No | 3 / 2 / 2 / 2 | missing-web-verify | `caution` | 1720 / 68 |
| Golden | 92.5 | Sí | 4 / 3 / 4 / 4 | (ninguno) | `caution` | 1808 / 68 |

Modelo resuelto: `jev-1.13.0`. Separación: `13.8 < 57.5 < 92.5`.

## Conclusión

La política hard-fail y `rubric-m1-v2` cumplen el corte aprobado: débil y medio inelegibles; golden elegible sin tope. El medio dispara solo `missing-web-verify` como se esperaba.
