# Verificación de persistencia GitHub — Misión 1 — 2026-10-01

- **Estado:** completada
- **Repositorio:** `ArturVargas/metro_app`
- **Evidencia:** [Issue #12](https://github.com/ArturVargas/metro_app/issues/12)
- **Participante sintético:** `p-system-test`
- **Persistencia probada:** Issue, comentario, etiquetas e idempotencia

## Cómo usar este reporte

Consulta esta evidencia antes de cambiar `GitHubIssueStore`, la convención de intentos o la autenticación del community writer. El Issue está cerrado para que no se confunda con una candidatura real, pero permanece en el historial.

## Procedimiento

1. Se evaluó un control fuerte con TypeSafe, sin `--record`.
2. Se generó y revisó el Markdown exacto mediante `DRY_RUN=1`.
3. Tras autorización explícita, se persistió ese `AttemptResult` con `github:record-attempt`.
4. Se consultaron Issue, comentario y etiquetas desde la API.
5. Se repitió exactamente la misma escritura para comprobar idempotencia.
6. Se cerró el Issue sintético con razón `completed`.

## Resultado

| Comprobación | Resultado |
| --- | --- |
| Issue | `Mission mission-m1 · participant p-system-test` |
| Comentario | Un intento con marcador estable |
| Puntaje | `100 / 100` |
| Elegibilidad | `yes` |
| Evaluador | TypeSafe, modelo resuelto `jev-1.13.0` |
| Feedback | `feedback-template-m1-v1` |
| Etiquetas | `mission:mission-m1`, `attempt:1`, `eligible:yes`, `routing:caution` |
| Repetición exacta | Mismo Issue y mismo comentario; total de comentarios permaneció en 1 |
| Estado final | Cerrado (`completed`) |

No se almacenaron números telefónicos, tokens ni secretos.

## Hallazgo de autenticación

Un fine-grained personal access token creado por `el-chalan-dev` falló con `403`, aunque esa cuenta es colaboradora con acceso de escritura. `metro_app` pertenece a la cuenta personal `ArturVargas`, y GitHub no admite ese tipo de token para operar como colaborador externo en este escenario.

La prueba exitosa utilizó un fine-grained token creado por `ArturVargas`, limitado al repositorio `metro_app` y con `Issues: Read and write`. El token no se registra en el repositorio.

## Dónde encontrar la implementación

- Writer e idempotencia: `apps/community/src/github/issue-store.ts`.
- Convención de Issue: `apps/community/src/github/markers.ts`.
- Formato del comentario: `packages/evaluation/src/comment-format.ts`.
- CLI de persistencia: `apps/community/src/cli/record-attempt.ts`.
- Configuración operativa: `.ai/references/operations/github-community-writer.md`.

## Skills relacionadas

- `superpowers:verification-before-completion`: verificar Issue, comentario y etiquetas antes de declarar éxito.
- `superpowers:systematic-debugging`: investigar errores de API, duplicados o escrituras parciales.
- `architecture-workflow`: cambiar fuente de verdad, identidad o mecanismo de autenticación.
