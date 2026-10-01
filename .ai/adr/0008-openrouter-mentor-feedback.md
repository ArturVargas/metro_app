# ADR-0008: Feedback LLM vía OpenRouter + mentor.md

- **Estado:** aceptada
- **Fecha:** 2026-10-01
- **Contexto:** ADR-0001 y ADR-0006 fijan que un LLM ligero solo redacta feedback a partir de puntajes ya calculados, con plantilla de respaldo. El modo `local` (Ollama) sirve en desarrollo, pero en el VPS de comunidad hace falta un proveedor HTTP gestionado, con prompt versionado en repo y sin secretos en git.

## Decisión

- Añadir `FEEDBACK_MODE=openrouter` en `apps/community`.
- `OpenRouterFeedbackGenerator` llama a OpenRouter **chat completions** (`POST {base}/chat/completions`) con el system prompt de `apps/community/prompts/mentor.md`.
- El mentor es **Picosito**: coach animado en español, roast cálido y constructivo. El frontmatter `version` (p. ej. `feedback-mentor-m1-v1`) viaja en `feedbackMetadata.version`.
- Variables de entorno: `OPENROUTER_API_KEY` (requerida en runtime), `OPENROUTER_MODEL` (default `google/gemini-2.5-flash`), `OPENROUTER_BASE_URL` opcional (default `https://openrouter.ai/api/v1`).
- El generador **nunca inventa ni altera el puntaje ni la elegibilidad**; el mensaje de usuario incluye los valores ya calculados y el prompt obliga a copiarlos.
- Si falta la API key, falla la red, o la respuesta está vacía/malformed, el generador **cae a la plantilla** `feedback-template-m1-v1` (mismo contrato que el stub). `evaluate()` sigue rechazando texto LLM inválido (puntaje distinto, >2 problemas, menciones a Jev/TypeSafe) y conserva la plantilla de `packages/evaluation`.
- `FEEDBACK_MODE=local` (Ollama) y `stub` se mantienen. `http` sigue sin configurar (placeholder distinto de OpenRouter).
- No se toca Hermes/WhatsApp en este cambio. Secretos solo en `.env.local` / entorno del VPS; nunca en el repositorio.

## Alternativas consideradas

- Usar solo Ollama en el VPS: rechazado por operación y disponibilidad del modelo en el host de comunidad.
- Meter el system prompt en código TypeScript: rechazado; `mentor.md` versionado facilita iterar el tono sin mezclarlo con el adaptador HTTP.
- Reutilizar `FEEDBACK_MODE=http` para OpenRouter: rechazado; `http` queda reservado como placeholder genérico; OpenRouter es un modo explícito con env y provenance propios (`provider: "openrouter"`).
- Dejar que el modelo recalcule o “mejore” el puntaje: rechazado (ADR-0001 / ADR-0006).

## Consecuencias

- En el VPS: `FEEDBACK_MODE=openrouter`, `OPENROUTER_API_KEY=…`, opcionalmente modelo/base URL en `.env.local`.
- Tests unitarios mockean `fetch`; no se hacen llamadas reales en CI.
- Provenance LLM: `{ kind: "llm", version, provider: "openrouter", model }`.
- Cambios de tono del mentor se hacen editando `mentor.md` y subiendo `version` en el frontmatter.

## Reabrir si

- OpenRouter o el modelo default dejan de cumplir latencia/costo del ritmo del grupo.
- El formato estructurado (encabezados + bullets) falla con demasiada frecuencia frente a la plantilla.
- Se adopta otro proveedor cloud como modo primario (entonces un ADR nuevo o una extensión de este).
