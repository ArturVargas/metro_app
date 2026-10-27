# Contrato interno — Misión 3

## 1. Identidad

- **ID de misión:** `mission-m3`
- **Versión:** `1`
- **Modalidad:** `participant-pr` ([ADR-0011](../../../../adr/0011-participant-forks-and-pr-qualification.md))
- **Estado:** `aprobado`; pendiente de publicación
- **Título:** Pasajeros en espera
- **Brief público:** [`public-brief.md`](public-brief.md)
- **Diseño:** [`docs/superpowers/specs/2026-10-23-mission-3-passengers-design.md`](../../../../../docs/superpowers/specs/2026-10-23-mission-3-passengers-design.md)
- **Responsable:** `ArturVargas`
- **Zona horaria operativa:** `America/Bogota` (UTC-5), la misma ventana de evaluación que en Misión 2.

## 2. Calendario

| Misión | Apertura | Cierre | Estado |
| --- | --- | --- | --- |
| Misión 3 | viernes 30 de octubre de 2026 | jueves 5 de noviembre de 2026, 23:55 | **APROBADA** por Artur (decisiones D1 y D4) |
| Misión 4 | viernes 6 de noviembre de 2026 | jueves 12 de noviembre de 2026, 23:55 | **APROBADA** por Artur (decisión D4) |
| Misión 5 | viernes 13 de noviembre de 2026 | jueves 19 de noviembre de 2026, 23:55 | **APROBADA** por Artur (decisión D4) |

Las tres misiones forman la fase de tres semanas de ADR-0011. La hora de apertura del viernes y la del mensaje público: `PENDIENTE`.

- **Evaluaciones:** martes a domingo, 06:00–23:55 America/Bogota; lunes cerrado (la ventana que hoy aplica `~/bin/metro-eval`). Si la fase usa otra ventana, cambia aquí y en Hermes a la vez.
- **Issue principal / Project:** `PENDIENTE`; crear el Issue "Mission mission-m3" en el Project comunitario antes de publicar.

## 3. Código base

- **Repositorio:** `ArturVargas/metro_app`
- **Rama:** `dev`
- **SHA base congelado:** `1c60eea3b88962768dae0501e2cc9b8f20041b29`. Conserva `apps/game` de la versión B de Misión 2 e integra mediante el PR #51 los workflows y la infraestructura de evaluación de Misión 3. Es el `M3_DEV_SHA`. Verificar que `origin/dev` sigue en este SHA el día de la apertura.
- **Preview de partida:** https://metro-app-b.pages.dev/ (verificado 2026-10-26: muestra "Metro App — B" de p-026).
- **Área de cambio esperada:** `apps/game/`.
- **Rutas protegidas** (`M3_PROTECTED_PATHS` en `packages/evaluation/src/m3-policy.ts`): `.github/`, `apps/community/`, `packages/evaluation/`, `.env*`, cualquier `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.nvmrc`.
- **Dependencias:** ninguna nueva. `apps/game` no tiene runner de pruebas; la misión no pide uno.
- **Checks requeridos:** `Lint, typecheck and web build` y `PR description` (workflows `participant-pr-checks.yml` y `participant-pr-description.yml` en `dev`).

## 4. Criterios públicos y evidencia

La rúbrica de M3 (`rubric-m3-v2`; `rubric-m3-v1` en la primera calibración) mide la correspondencia entre el prompt del participante y su diff; no tiene criterios propios de la misión. El cumplimiento de las reglas fijas del brief se comprueba en la revisión técnica. La tabla dice dónde se ve cada criterio.

| Criterio público | Regla fija | Evidencia en la rúbrica M3 | Comprobación en revisión técnica |
| --- | --- | --- | --- |
| Aparecen pasajeros después de asignar un tren y pulsar **Ejecutar**; sin tren, **Ejecutar** se comporta como hoy | 4 | `requirement-coverage`, `behavioral-fidelity` (frecuencia y condición de inicio declaradas en el prompt) | Paso 1 y 2 de la prueba común |
| Cada pasajero muestra una forma de destino distinta de su estación | 1, 2 | `requirement-coverage`, `behavioral-fidelity` (distribución de destinos declarada) | Paso 3 |
| **Parar** detiene la llegada; **Ejecutar** continúa sin acumular | 4 | `behavioral-fidelity` (condiciones y estados) | Paso 4 |
| Máximo doce pasajeros por estación | 3 | `behavioral-fidelity` (límites) | Paso 5 |
| Los primeros diez pasajeros coinciden en dos partidas nuevas | 5 | `behavioral-fidelity` (orden); `verification-evidence` (comparación declarada) | Paso 6 |
| Legible en teléfono sin tapar estaciones ni controles; el juego anterior sigue funcionando | — | `scope-fidelity` (comportamiento preservado y exclusiones); `verification-evidence` | Pasos 7 y 8 |
| Recargar vacía las colas | 6 | `scope-fidelity` (sin persistencia) | Paso 8 |

`verification-evidence` espera pasos manuales con resultado observado; lint, typecheck y build solos dan nivel 1. `traceability` compara la declaración LLM/manual/combinado con el diff.

Reproducibilidad: los primeros diez pasajeros de dos partidas nuevas tienen el mismo orden de estación de origen y forma de destino. El orden avanza una vez por pasajero generado, no por frame. **Parar** no avanza la generación ni su espera pendiente y **Ejecutar** reanuda sin llegadas acumuladas. Ocultar la pestaña queda fuera de la misión y no equivale a **Parar**.

Fuera de alcance (un diff que lo implemente pierde en `scope-fidelity`): abordaje, viajes, bajada, transferencias, cambios en los trenes, alertas o derrota por saturación, puntaje, días, demanda basada en datos, guardado, backend, cambios en las ocho estaciones o en el límite de líneas.

## 5. Evaluación y calificación

- **Rúbrica:** `rubric-m3-v2` (igual que `rubric-m3-v1` salvo el descriptor de fidelidad; puntaje continuo y `core-gap` por probabilidad, integrada mediante el PR #48) + política `m3-policy` (`core-gap` deja el total en 0; los demás hard-fails lo topan en 80).
- **Umbral:** total estrictamente mayor que 80, sin hard-fail, con los dos checks en verde.
- **Intentos:** máximo cinco evaluaciones por participante en la misión; cada una pertenece al HEAD exacto del PR. Un SHA ya evaluado no se reevalúa.
- **Identificador:** `p-` + últimos 3 dígitos del teléfono (sufijo de colisión si ya se asignó).
- **Calibración:** [`calibration-2026-10-22-rubric-m3-v1.md`](calibration-2026-10-22-rubric-m3-v1.md) (general) y [`calibration-2026-10-26-passengers.md`](calibration-2026-10-26-passengers.md) (esta misión): **`ready` con `rubric-m3-v2`**: el caso fuerte califica en 16 de 16 corridas (81.9–85.4); débil, medio y la variante con una desviación quedan en 0. Con `rubric-m3-v1` fue `not ready` (1 de 3). Los fixtures de calibración son privados y viven solo en el VPS (`~/m3-calib/private/`).

## 6. Revisión técnica y A/B/C

- Cola técnica en el orden de `Queued at` (primera hora en que el SHA calificado tuvo todos los checks en verde).
- Un finding dice qué falla y cómo reproducirlo, sin la solución.
- Los tres primeros PRs aprobados ocupan A, B y C en ese orden (`slot:a|b|c`). No hay votación. Ningún PR se mezcla por su puntaje; el equipo integra y despliega.

### Prueba manual común

1. Sin líneas ni trenes: **Ejecutar** sigue deshabilitado y no aparecen pasajeros.
2. Crear una línea (se asigna su tren) y pulsar **Ejecutar**: aparecen pasajeros con el tiempo.
3. Cada pasajero tiene forma de destino reconocible y distinta de la de su estación.
4. Pulsar **Parar** ~10 s: no aparece ninguno. Pulsar **Ejecutar**: la llegada sigue sin un salto de pasajeros.
5. Dejar correr hasta que alguna estación llegue a doce: no pasa de doce.
6. Recargar dos veces y anotar estación y forma de los primeros diez pasajeros de cada partida: coinciden en orden.
7. Vista de teléfono (≈375×812) con toque: las colas son legibles y no tapan estaciones ni controles.
8. Crear, editar y borrar líneas, retirar y reasignar trenes, **Reset** y recarga siguen funcionando; recargar vacía las colas.

## Pendientes antes de publicar

- Agregar el Issue principal [#50](https://github.com/ArturVargas/metro_app/issues/50) al Project.
- El 30 de octubre: activar `METRO_ACTIVE_MISSION=mission-m3` y `RECORD_ATTEMPTS=1` en el VPS.
- Publicar el mensaje en WhatsApp.

Hecho: checkout del VPS con `rubric-m3-v2`, cambios de Hermes aplicados (`../../../operations/hermes-m3/`), Issue #50 creado y `M3_DEV_SHA` en el VPS actualizado a `1c60eea3b88962768dae0501e2cc9b8f20041b29` (2026-10-27).

## Decisiones registradas

| ID | Fecha y hora | Decisión | Quién y dónde |
| --- | --- | --- | --- |
| D1 | 2026-10-26, 09:17 America/Mexico_City | Misión 3 abre el **viernes 30 de octubre de 2026**. El cierre de Misión 3 (jueves 5 de noviembre) y las fechas de Misiones 4 (viernes 6 de noviembre) y 5 (viernes 13 de noviembre) siguen siendo **PROPUESTA** (reemplazado por D4). | Artur, aprobación explícita en el chat de trabajo con el asistente del equipo |
| D2 | 2026-10-26 | Los fixtures de calibración de Misión 3 quedan privados en el VPS hasta el cierre de la misión; el reporte publica solo puntajes y hashes SHA-256. Al cerrar, se versionan en `apps/community/fixtures/calibration-m3/`. | Artur, en el chat de trabajo y en la respuesta a la revisión del PR #49 |
| D3 | 2026-10-26, 10:50 America/Mexico_City | Abrir los PRs de `rubric-m3-v2` (#48) y de esta documentación (#49) contra `main`, sin mergear hasta revisión. | Artur, en el chat de trabajo |
| D4 | 2026-10-26, antes de las 12:00 America/Mexico_City | Misión 3 cierra el **jueves 5 de noviembre de 2026 a las 23:55**; Misión 4 abre el **viernes 6 de noviembre** y Misión 5 el **viernes 13 de noviembre**. Se aprueban el brief y el mensaje para publicación una vez completada la preparación operativa. | Artur, confirmación explícita en el chat de trabajo |
| D5 | 2026-10-26 | El PR #51 sincroniza en `dev` la infraestructura de Misión 3 sin cambiar `apps/game`; `1c60eea3b88962768dae0501e2cc9b8f20041b29` reemplaza al SHA anterior como `M3_DEV_SHA`. | Merge aprobado por Artur y verificación del equipo |
