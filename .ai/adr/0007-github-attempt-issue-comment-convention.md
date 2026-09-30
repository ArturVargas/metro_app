# ADR-0007: Convención issue×misión×participante y comentarios con tags

- **Estado:** aceptada
- **Fecha:** 2026-09-29
- **Contexto:** ADR-0002 fijó GitHub Issues como fuente de verdad. Hace falta el contrato operativo de persistencia de intentos de evaluación antes de Hermes/Jev/LLM: un issue por participante y misión, comentarios por intento, y etiquetas/tags estables.

## Decisión

### Identidad del issue

- **Un GitHub Issue por `(participantId × missionId)`**.
- Título: `Mission <missionId> · participant <participantId>`.
- Cuerpo con marcador estable:
  - `<!-- metro-issue: mission:<id> participant:<id> -->`
  - líneas de texto `mission:<id>` y `participant:<id>` para búsqueda determinista.
- El writer busca por API de search (o list+filter) usando esas claves; si no existe, crea el issue.

### Comentarios = intentos

- Cada intento de evaluación es un **comentario** en ese issue.
- El cuerpo markdown (builder puro en `@metro/evaluation`) incluye: prompt, puntaje total, niveles por dimensión, feedback (texto ya aportado por el caller), línea de tags.
- Marcador de comentario: `<!-- metro-attempt: mission:… participant:… attempt:N -->`.
- Marcador interno adicional: `<!-- metro-evaluation: ... -->` con proveedor, modelo solicitado, modelo resuelto y versión del generador de feedback.
- WhatsApp / plantillas orientadas a participantes **no nombran Jev**. Metadatos internos pueden hablar de evaluación.
- Antes de evaluar y nuevamente antes de escribir, el backend lee los comentarios existentes: el intento debe ser exactamente el siguiente de la secuencia y se rechaza cualquier sexto intento.
- Un resultado del evaluador mock nunca puede persistirse como intento real.
- El MVP opera un solo proceso writer. Un lock en memoria por `(repo × misión × participante)` serializa admisión, evaluación y persistencia dentro de ese proceso.
- Un retry con cuerpo exacto reutiliza el comentario existente y repara labels sin consumir otro intento. Los labels se sincronizan antes de crear el comentario para que un fallo de labels no deje un intento ya consumido e imposible de reintentar.
- Ejecutar varios procesos writer requiere primero una cola o lease distribuido; el lock del MVP no coordina procesos ni hosts distintos.

### Tags y labels

Tags estables en el comentario:

- `attempt:N`
- `score:0-100` (entero redondeado)
- `routing:auto|caution|defer`
- `eligible:yes|no` (elegibilidad del **último** intento; umbral ≥70)

Labels del issue se actualizan desde el **último** intento para reflejar estado (alineado con ADR-0002: labels = estados, no taxonomía de cada puntaje histórico):

- `mission:<id>`
- `routing:…`
- `eligible:yes|no`
- `attempt:N`

El valor `score:NN` vive en la línea de tags del comentario (y puede omitirse como label para no proliferar labels numéricos).

### Código

- Tipos/`AttemptResult`, helpers de tags y formatter de markdown: `packages/evaluation` (puros, sin red).
- Writer Octokit (`GitHubIssueStore`): `apps/community`.
- Auth: `GITHUB_TOKEN` o `GH_TOKEN` (nunca versionar secretos).
- Fuera de alcance de este ADR: adaptador Jev, Hermes, generación LLM de feedback.

## Alternativas consideradas

- Un issue por intento: rechazado; dificulta el historial por participante×misión.
- Solo labels con el puntaje: rechazado (ADR-0002); el score histórico queda en comentarios.
- Persistencia en PostgreSQL: rechazado para el piloto (ADR-0002).

## Consecuencias

- El CLI `github:record-attempt` permite dry-run con fixture sin token.
- CI del juego no depende de `@metro/community`.
- Si GitHub search retrasa indexación, el writer puede caer a list+filter por marcador.

## Reabrir si

- Los límites de API o la latencia de search producen duplicados de issues.
- Se necesita un esquema de Projects fields distinto que reemplace labels/tags.
- El umbral de elegibilidad deja de ser ≥70 o deja de basarse solo en el último intento.
