# Calibración TypeSafe — Misión 2 — rubric-m2-v1 — 2026-10-06

- **Estado:** completada
- **Misión:** `mission-m2`
- **Rúbrica:** `rubric-m2-v1` (sin hard-fails en v1)
- **Modelo solicitado:** `jev-latest`
- **Persistencia:** desactivada (`--record` no usado); no crea Issues ni comentarios
- **Feedback:** `FEEDBACK_MODE=stub` → `feedback-template-m2-v1`

## Objetivo

Comprobar con tres controles que `rubric-m2-v1` ordena la calidad de los prompts de trenes (débil / medio / fuerte), mantiene débil y medio debajo de 70, y reconoce como elegible un prompt fuerte alineado al brief público.

## Procedimiento

Los tres controles reciben exactamente [`public-brief.md`](public-brief.md) como contexto. Cada uno se evalúa una vez mediante TypeSafe (`JEV_MODE=http`) desde `pnpm --filter @metro/community evaluate` en el VPS, sin `--record`. El backend calcula el total con los pesos de `rubric-m2-v1`; la confianza solo determina el enrutado.

Fixtures locales (no se envían a GitHub): `apps/community/fixtures/calibration-m2/{debil,medio,fuerte}.json`.

## Controles predefinidos

| Control | Expectativa | Prompt exacto |
| --- | --- | --- |
| Débil | Menor que 70 | Haz que los trenes se muevan de forma divertida y se vean bonitos sobre las líneas. |
| Medio | Debe quedar entre el débil y el fuerte; debajo de 70 | Permite asignar un tren a una línea y verlo moverse. Conserva las ocho estaciones y la creación de líneas actuales. |
| Fuerte | Mayor o igual que 70 | Implementa en el tablero actual la interacción para asignar un tren a una línea (máximo uno por línea) con mouse y pantalla táctil, y verlo moverse a velocidad fija. En una línea abierta el tren va de un extremo al otro y regresa; en un circuito continúa en una sola dirección. El tren empieza al asignarlo; el jugador puede retirarlo y reasignarlo sin recargar. Si se elimina su línea, el tren queda disponible; si la línea cambia, el tren sigue asignado y puede reiniciar desde una estación. Conserva las ocho estaciones y la creación de líneas de la versión Base, el estado local (al recargar se reinician líneas y trenes) y el cliente universal Expo/web. No agregues pasajeros, demanda, capacidad, puntaje, colisiones, pausa, controles de velocidad ni backend del juego. Termina cuando una persona pueda abrir el build web, asignar un tren, ver movimiento en línea abierta y en circuito, retirar y reasignar, y repetir la prueba con mouse y toque en menos de un minuto. |

## Resultados

Las tres llamadas usaron `jev-latest`; TypeSafe resolvió `jev-1.13.0`. No se envió `--record` y no hubo escrituras en GitHub. Zona horaria de la corrida: America/Bogota (UTC-5), 2026-10-06.

| Control | Total | Elegible | Niveles V/A/E/L | Enrutado | Tokens entrada/salida |
| --- | ---: | --- | --- | --- | ---: |
| Débil | 21.3 | No | 1 / 1 / 1 / 0 | `defer` | 1531 / 68 |
| Medio | 36.3 | No | 1 / 2 / 1 / 2 | `defer` | 1537 / 68 |
| Fuerte | 93.8 | Sí | 4 / 4 / 3 / 4 | `defer` | 1743 / 68 |

`V/A/E/L` significa verificabilidad, instrucciones accionables, especificidad y límites de alcance. Hard-fails: ninguno (política v1). Separación: `21.3 < 36.3 < 93.8`.

## Conclusión

La prueba cumple el criterio de calibración: el control débil y el medio quedan debajo de 70; el fuerte queda encima y es elegible. El orden de calidad se respeta. No se propone cambiar `rubric-m2-v1`, sus pesos ni el umbral de 70 con esta evidencia. La calibración TypeSafe de Misión 2 queda **cerrada**.

## Observaciones abiertas

- Los tres resultados quedaron en `routing: defer` por confianza baja en al menos una dimensión (débil: actionable-acceptance; medio: actionable-acceptance; fuerte: specificity). El contrato indica que la confianza no cambia el puntaje; falta definir cómo atender `defer`/`caution` en la operación del grupo (igual que en M1).
- El control medio quedó más lejos del umbral (36.3) que el intermedio de M1 (~63). Sigue cumpliendo el rol de punto medio ordenado; si se quiere un control más cercano al corte 70, se puede añadir una repetición con un prompt intermedio más completo en una calibración futura, sin reabrir v1.
- Pendientes del contrato interno que **no** cierra esta calibración: fechas/horarios/zona horaria, issue principal del Project, condiciones idénticas A/B/C. El estado global del contrato puede seguir en `borrador` hasta cerrar esos ítems.
