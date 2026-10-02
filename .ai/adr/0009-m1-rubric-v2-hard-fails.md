# ADR-0009: Rúbrica M1 v2 y política de hard-fail de elegibilidad

- **Estado:** aceptada
- **Fecha:** 2026-10-01
- **Contexto:** La calibración de `rubric-m1-v1` (2026-09-30) ordenó bien débil / umbral / fuerte, pero el producto aprobó una política explícita: ciertos faltantes deben **forzar inelegibilidad** (o topar el total &lt;70), mientras que otros defectos solo deben mantener el compuesto &lt;70 vía la rúbrica. Hacía falta versionar esa decisión sin mezclarla con el umbral 70 ni con el feedback LLM (ADR-0006 / ADR-0008).

## Decisión

- Introducir **`rubric-m1-v2`** en `packages/evaluation` como rúbrica por defecto de Mission 1. Conserva los mismos cuatro Score (verifiability 0.30, actionable-acceptance 0.30, specificity 0.25, scope-limits 0.15) y el umbral **≥70**.
- Los criterios situacionales de v2 nombran con más fuerza los fallos **SOFT** (tablero “más bonito/jugable” sin observables; flujo mouse/touch ambiguo; tech contradictoria o deps innecesarias frente a Expo/RN) para que el compuesto se quede &lt;70 **solo con pesos Score**.
- Añadir una **política de elegibilidad hard-fail** (`hard-fail.ts`):
  - **HARD** (fuerza `eligible=false` y tope `HARD_FAIL_SCORE_CAP=69`):
    - no seleccionar + conectar dos estaciones
    - no línea claramente visible entre ellas
    - no verificación en build web (&lt;1 min)
    - altera conteo/identidad/posiciones de las 8 estaciones
    - exige demanda/pasajeros/backend del juego en M1
  - **SOFT** (no aparecen como ids hard-fail; solo rúbrica): vaguedad “más bonito”, flujo select-connect ambiguo, tech incompatible / deps innecesarias.
- `evaluate()` usa `rubric-m1-v2` por defecto, detecta hard-fails del prompt (inyectables en tests) y aplica la política **después** de `scoreFromAnswers`. `rubric-m1-v1` sigue cableada sin hard-fail policy.
- `apps/community` hereda el default vía `@metro/evaluation` (sin flag nuevo obligatorio).
- Expo / React Native siguen in-bounds en specificity. WhatsApp no nombra Jev. Secretos fuera del repo.

## Alternativas consideradas

- Solo endurecer textos de `rubric-m1-v1` sin versión nueva: rechazado; la calibración v1 queda como evidencia histórica y el contrato interno debe apuntar a una versión explícita.
- Modelar hard-fails solo como Score más bajos sin tope de elegibilidad: rechazado; un compuesto ≥70 con un faltante HARD seguiría siendo elegible.
- Añadir preguntas Noul a TypeSafe en este cambio: aplazado; el adaptador HTTP actual es Score-only; la detección de hard-fail vive en el backend de evaluación con tests deterministas, y Jev sigue juzgando calidad Score.
- Bajar el umbral global por debajo de 70: rechazado; el umbral aprobado permanece en 70.

## Consecuencias

- Default de evaluación Mission 1: `rubric-m1-v2` + hard-fail policy.
- Calibración en vivo debe repetirse con v2 (controles débil / medio / golden) sin `--record`.
- Actualizar contrato interno y brief/README de evaluación cuando se adopte en operación.
- Reabrir si TypeSafe adopta gates Noul oficiales o si la detección de hard-fail diverge de juicio humano de forma sistemática.

## Reabrir si

- Los hard-fails deterministas rechazan prompts que revisores humanos consideran elegibles (o al revés) de forma recurrente.
- Se cablean preguntas Noul/Choice en el cliente Jev para gates de elegibilidad.
- Mission 1 cambia el brief público de forma que invalide la lista HARD/SOFT.
