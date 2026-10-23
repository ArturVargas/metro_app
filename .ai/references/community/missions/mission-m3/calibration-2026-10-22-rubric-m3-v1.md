# Calibración TypeSafe — Misión 3 — rubric-m3-v1 — 2026-10-22

- **Estado:** completada; umbral sin casos reales cerca de 80; política `core-gap` = 0 aplicada en la columna "Final"
- **Misión:** `mission-m3`
- **Rúbrica:** `rubric-m3-v1` + política `m3-policy` (`core-gap` deja el total en 0; los demás hard-fails lo topan en 80)
- **Modelo:** `jev-latest`, resuelto a `jev-1.14.0` (Misión 2 usó `jev-1.13.0`)
- **Persistencia:** desactivada (`--record` no usado)
- **Califica:** total > 80, sin hard-fail y checks en verde

## Procedimiento

Cada fixture envía prompt, diff contra la base, pruebas declaradas, origen y explicación por `state` a TypeSafe (`JEV_MODE=http`) con `pnpm --filter @metro/community evaluate` en un clon separado del VPS. Corridas entre 20:20 y 20:40 (America/Mexico_City, UTC-6). Fixtures: `apps/community/fixtures/calibration-m3/`.

Material real: ramas A/B/C de Misión 2 con los prompts de p-898, p-026 y p-549. "llm" es el primer commit generado por el LLM; "final" es la rama desplegada. Material sintético: contradicción, cambio superficial, inyección dirigida al evaluador, alcance de más y una misión de ensayo pequeña con brief propio.

## Resultados (corrida 3; corrida 2 entre paréntesis si difiere)

Niveles R/B/S/V/T = cobertura / fidelidad / alcance / evidencia / trazabilidad (0–4). "Rúbrica" es el total ponderado que se midió con la política anterior (tope 80 para todo hard-fail). "Final" aplica la política decidida el 2026-10-22: con `core-gap` el total es 0. Se recalculó desde los mismos niveles, sin volver a llamar a TypeSafe, porque la política solo depende de ellos.

| Caso | Expectativa manual | Rúbrica | Final | Niveles | Hard-fails |
| --- | --- | --- | --- | --- | --- |
| real-a-llm | débil | 16.2 | 0 | 1/0/0/1/2 | core-gap |
| real-b-llm | medio | 28.8 | 0 | 2/0/1/1/2 | core-gap |
| real-c-llm | débil/medio | 40.0 | 0 | 2/1/2/1/2 | core-gap |
| real-a-final | fuerte | 68.8 | 0 | 3/2/3/3/3 | core-gap |
| real-b-final | fuerte | 61.3 (58.7) | 0 | 3/2/2/3/2 | core-gap |
| real-c-final | fuerte | 68.8 | 0 | 3/2/3/3/3 | core-gap |
| real-c-final-aligned | fuerte, prompt ajustado | 68.8 | 0 | 3/2/3/3/3 | core-gap |
| syn-x-vs-y | débil | 22.5 | 0 | 0/1/2/1/1 | core-gap |
| syn-superficial | débil | 43.8 | 0 | 1/1/3/2/3 | core-gap |
| syn-injection | débil con inyección | 37.5 (35.0) | 0 | 1/0/3/2/3 | evaluator-injection, hidden-text, core-gap |
| syn-injection-strong | fuerte con inyección | 68.8 | 0 | 3/2/3/3/3 | evaluator-injection, core-gap |
| syn-near-miss | medio | 66.3 (61.3) | 0 | 3/2/3/3/2 | core-gap |
| syn-subtle-contradiction | medio/débil | 53.8 | 0 | 3/1/2/2/3 | core-gap |
| syn-scope-creep | medio | 38.8 | 0 | 3/1/0/2/1 | core-gap |
| syn-small-mid | medio | 46.3 (43.8) | 0 | 2/1/2/2/3 | core-gap |
| syn-small-near | cerca del umbral | 65.0 | 0 | 3/2/3/2/3 | core-gap |
| syn-small-strong | fuerte | 87.5 | 87.5 | 4/3/4/3/3 | — |

## Lectura

- Con la política final, 16 de 17 casos quedan en 0 y solo `syn-small-strong` conserva su total (87.5) y califica. Los niveles por dimensión y el feedback no cambian; el participante recibe el mismo feedback completo con puntaje 0.
- En la columna "Rúbrica" el orden coincide con la expectativa manual y las dos corridas difieren como máximo 5 puntos.
- Ningún total observado cae entre 68.8 y 87.5: 80/81 separa este conjunto, pero no se probó justo en el borde. En la rejilla de niveles, 3/3/4/3/3 = 80.0 no califica y 3/4/3/3/3 = 81.25 sí.
- Los PRs reales fuertes (diffs de 20–30 KB, prompts de 4–9 mil caracteres) reciben fidelidad 2 y ~69 aunque el prompt se ajuste al código. Con `jev-1.14.0` un PR de ese tamaño no califica. Decisión (2026-10-22): las misiones se diseñan como PRs pequeños de alcance acotado para que el umbral de 80 funcione; ver [`INDEX.md`](INDEX.md#diseño-de-misiones).
- La corrida 1 (borrador de rúbrica) marcó `hidden-text` por el U+2060 que inserta WhatsApp; ahora solo cuentan controles bidi y `<!--`.
