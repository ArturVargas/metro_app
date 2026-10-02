# Contrato interno — Misión 1

## 1. Identidad

- **ID de misión:** `mission-m1`
- **Versión:** `1`
- **Estado:** `borrador`
- **Brief público:** `missions/mission-m1/public-brief.md`
- **Responsable:** `PENDIENTE`
- **Zona horaria:** `PENDIENTE`
- **Evaluaciones:** `martes y jueves, con horarios pendientes`
- **Votación:** `PENDIENTE`
- **Publicación A/B/C:** `PENDIENTE`

## 2. Evaluación

### Rúbrica versionada

| Criterio | Qué comprueba | Evidencia esperada | Peso |
| --- | --- | --- | ---: |
| verifiability | Resultados observables y pruebas para decidir si funciona (selección/conexión de estaciones, línea visible, comprobación en web) | Señales comprobables en el prompt | 30 |
| actionable-acceptance | Contexto e instrucciones suficientes para que un agente cambie el producto sin inventar requisitos | Acceptance accionable en el prompt | 30 |
| specificity | Outcome e inputs concretos; no penaliza Expo/React Native (son del proyecto); sí penaliza tech contradictoria o dependencias innecesarias | Specs concretas y coherentes | 25 |
| scope-limits | In/out (8 estaciones, sin pasajeros, sin backend juego) | Límites explícitos | 15 |

- **Total:** 100 puntos.
- **Umbral de elegibilidad:** 70 puntos.
- **Máximo:** cinco evaluaciones por participante.
- **Versión elegible:** solo se considera el intento más reciente. Si ese intento obtiene menos de 70 puntos, el participante no entra en la votación.
- **Versión de la rúbrica:** `rubric-m1-v2` (ADR-0009; `rubric-m1-v1` permanece cableada sin hard-fail)
- **Hard-fail de elegibilidad (fuerza no elegible / tope 69):** falta select+connect de dos estaciones; falta línea claramente visible; falta verificación en build web (&lt;1 min); altera las 8 estaciones (conteo/identidad/posiciones); exige demanda/pasajeros/backend del juego.
- **Soft-fail (solo rúbrica, compuesto &lt;70):** vaguedad “más bonito/jugable” sin observables; flujo mouse/touch ambiguo; tech incompatible o deps innecesarias frente a Expo/RN.
- **Versión del prompt de feedback:** `PENDIENTE` para LLM; fallback `feedback-template-m1-v1`
- **Proveedor y modelo de feedback:** `PENDIENTE`
- **Fallback de feedback:** `feedback-template-m1-v1`, determinista y derivado solo de puntaje y dimensiones de `rubric-m1-v1`

Cada criterio debe evaluar la calidad del prompt frente al brief público. No debe premiar una solución técnica preferida ni introducir requisitos que la comunidad no recibió.

### Evidencia de calibración

La [calibración TypeSafe del 2026-09-30](calibration-2026-09-30.md) validó `rubric-m1-v1` (15.0 / 63.8 / 100.0). La [calibración del 2026-10-01](calibration-2026-10-01-m1-v2.md) para `rubric-m1-v2` + hard-fail obtuvo 13.8 / 57.5 / 92.5 (débil / medio / golden), todos con `jev-1.13.0` y sin `--record`. Permanece abierto el significado operativo de `routing: caution` antes de automatizar respuestas.


## 3. Código base

- **Repositorio:** `ArturVargas/metro_app`
- **Commit base:** `PENDIENTE`
- **Preview base:** `https://metro-app-base.pages.dev/`
- **Archivos o áreas permitidas:** `PENDIENTE`
- **Archivos o áreas protegidas:** `PENDIENTE`
- **Dependencias permitidas:** `PENDIENTE`
- **Comandos de instalación:** `PENDIENTE`
- **Comandos de build:** `PENDIENTE`
- **Comandos de validación:** `PENDIENTE`
- **Criterios públicos relacionados:** selección/conexión de estaciones + línea visible + comprobación web ↔ verifiability / actionable-acceptance; 8 estaciones / sin pasajeros / sin backend del juego ↔ scope-limits; outcome e inputs coherentes con el stack del proyecto ↔ specificity

## 4. Ejecución A/B/C

Las tres variantes usan exactamente estos valores (condiciones idénticas A/B/C — `PENDIENTE` hasta fijarlas):

- **Agente y versión:** `PENDIENTE`
- **Modelo:** `PENDIENTE`
- **Nivel de razonamiento:** `PENDIENTE`
- **Herramientas y permisos:** `PENDIENTE`
- **Presupuesto o límite de ejecución:** `PENDIENTE`
- **Tiempo máximo:** `PENDIENTE`
- **Pruebas obligatorias:** `PENDIENTE`
- **Criterios de aceptación:** `PENDIENTE`
- **Aislamiento:** cada variante usa una rama o worktree independiente y no puede ver los resultados de las otras.

Registra cualquier interrupción o desviación. Una variante ejecutada bajo condiciones distintas no entra en la comparación hasta repetirse con el contrato correcto.

La revisión posterior sigue [`../../execution-review.md`](../../execution-review.md). Los findings no recalifican el prompt ni crean intentos. El resultado generado se conserva como evidencia; solo un `security-blocker` o un fallo que impida desplegar o probar exige corrección antes de publicar.

## 5. GitHub

- **Issue principal de la misión:** `PENDIENTE`
- **Project y vista:** `PENDIENTE`
- **Campos obligatorios:** misión, versión, participante seudónimo, intento, prompt exacto, puntaje, elegibilidad, estado y fechas.
- **Comentarios por evaluación:** puntaje, feedback, versión de rúbrica y versión del generador de feedback.
- **Comentarios por ejecución:** findings vinculados con variante, PR y requisito del prompt; se distinguen de los comentarios de evaluación y no incrementan el contador de intentos.
- **Etiquetas:** `PENDIENTE`
- **Selección:** registra votos válidos, desempate si aplica y los tres prompts ganadores.
- **Mapeo aleatorio:** conserva para A, B y C el autor, prompt exacto, puntaje, intento, issue, rama, pull request, commit y preview.

GitHub usa identificadores seudónimos. No se almacenan números telefónicos ni secretos.

## 6. Publicación

- **Preview A:** `PENDIENTE` (hasta que existan ganadores)
- **Preview B:** `PENDIENTE` (hasta que existan ganadores)
- **Preview C:** `PENDIENTE` (hasta que existan ganadores)
- **Prueba rápida común:** `PENDIENTE`
- **Resultado de pruebas:** `PENDIENTE`
- **Aprobación técnica:** `PENDIENTE`
- **Riesgos conocidos:** `PENDIENTE`
- **Procedimiento para revertir:** `PENDIENTE`
- **Mensaje del viernes:** `PENDIENTE`

<!-- TODO: fechas, horarios y zona horaria concretos están PENDIENTE — deben definirse antes de publicar el brief en WhatsApp. -->
