# Contrato interno — Misión 3

## 1. Identidad

- **ID de misión:** `mission-m3`
- **Versión:** `1`
- **Modalidad:** `participant-pr` ([ADR-0011](../../../../adr/0011-participant-forks-and-pr-qualification.md))
- **Estado:** `borrador` (pendiente de aprobación de Artur)
- **Título:** Pasajeros en espera
- **Brief público:** [`public-brief.md`](public-brief.md)
- **Diseño:** [`docs/superpowers/specs/2026-10-23-mission-3-passengers-design.md`](../../../../../docs/superpowers/specs/2026-10-23-mission-3-passengers-design.md)
- **Responsable:** `ArturVargas`
- **Zona horaria operativa:** `America/Bogota` (UTC-5), la misma ventana de evaluación que en Misión 2.

## 2. Calendario

| Misión | Apertura | Cierre | Estado |
| --- | --- | --- | --- |
| Misión 3 | viernes 30 de octubre de 2026 | jueves 5 de noviembre de 2026, 23:55 | apertura aprobada por Artur (2026-10-26); **cierre: PROPUESTA** |
| Misión 4 | viernes 6 de noviembre de 2026 | jueves 12 de noviembre de 2026, 23:55 | **PROPUESTA**, confirmar Artur |
| Misión 5 | viernes 13 de noviembre de 2026 | jueves 19 de noviembre de 2026, 23:55 | **PROPUESTA**, confirmar Artur |

Las tres misiones forman la fase de tres semanas de ADR-0011. La hora de apertura del viernes y la del mensaje público: `PENDIENTE`.

- **Evaluaciones:** martes a domingo, 06:00–23:55 America/Bogota; lunes cerrado (la ventana que hoy aplica `~/bin/metro-eval`). Si la fase usa otra ventana, cambia aquí y en Hermes a la vez.
- **Issue principal / Project:** `PENDIENTE`; crear el Issue "Mission mission-m3" en el Project comunitario antes de publicar.

## 3. Código base

- **Repositorio:** `ArturVargas/metro_app`
- **Rama:** `dev`
- **SHA base congelado:** `acd8258ce3dcc45f01c449e47204b10aa7e45b7f` (versión B de Misión 2, `2e3f805`, más dos commits de tooling de PR). Es el `M3_DEV_SHA`. Verificar que `origin/dev` sigue en este SHA el día de la apertura.
- **Preview de partida:** https://metro-app-b.pages.dev/ (verificado 2026-10-26: muestra "Metro App — B" de p-026).
- **Área de cambio esperada:** `apps/game/`.
- **Rutas protegidas** (`M3_PROTECTED_PATHS` en `packages/evaluation/src/m3-policy.ts`): `.github/`, `apps/community/`, `packages/evaluation/`, `.env*`, cualquier `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.nvmrc`.
- **Dependencias:** ninguna nueva. `apps/game` no tiene runner de pruebas; la misión no pide uno.
- **Checks requeridos:** `Lint, typecheck and web build` y `PR description` (workflows `participant-pr-checks.yml` y `participant-pr-description.yml` en `dev`).

## 4. Criterios públicos y evidencia

`rubric-m3-v1` mide la correspondencia entre el prompt del participante y su diff; no tiene criterios propios de la misión. El cumplimiento de las reglas fijas del brief se comprueba en la revisión técnica. La tabla dice dónde se ve cada criterio.

| Criterio público | Regla fija | Evidencia en `rubric-m3-v1` | Comprobación en revisión técnica |
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

- **Rúbrica:** `rubric-m3-v1` + política `m3-policy` (`core-gap` deja el total en 0; los demás hard-fails lo topan en 80).
- **Umbral:** total estrictamente mayor que 80, sin hard-fail, con los dos checks en verde.
- **Intentos:** máximo cinco evaluaciones por participante en la misión; cada una pertenece al HEAD exacto del PR. Un SHA ya evaluado no se reevalúa.
- **Identificador:** `p-` + últimos 3 dígitos del teléfono (sufijo de colisión si ya se asignó).
- **Calibración:** [`calibration-2026-10-22-rubric-m3-v1.md`](calibration-2026-10-22-rubric-m3-v1.md) (general) y [`calibration-2026-10-26-passengers.md`](calibration-2026-10-26-passengers.md) (esta misión): **`not ready`**: el caso fuerte califica en 1 de 3 corridas (80.0, 80.0, 87.5); bloquea la publicación hasta que Artur decida. Los fixtures de calibración son privados y viven solo en el VPS (`~/m3-calib/private/`).

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

- Decidir qué hacer con la calibración `not ready`.
- Aprobación de Artur de este contrato, del brief y del mensaje público.
- Confirmar cierre de Misión 3 y fechas de Misiones 4 y 5 (hoy son propuesta).
- Crear el Issue principal de Misión 3 en el Project.
- Aplicar y verificar los cambios de Hermes en el VPS (`../../../operations/hermes-m3/`) y activar `METRO_ACTIVE_MISSION=mission-m3` con `RECORD_ATTEMPTS=1` solo el día de apertura.
