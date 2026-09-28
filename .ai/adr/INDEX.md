# Índice de ADRs

Lee un ADR cuando una tarea toque su decisión o cuando aparezca una condición de reapertura.

| ADR | Estado | Decisión |
| --- | --- | --- |
| [`0001`](0001-prompt-evaluation-and-variant-experiment.md) | Aceptada | Jev evalúa, el LLM explica y tres prompts producen variantes A/B/C |
| [`0002`](0002-github-as-community-system-of-record.md) | Aceptada | GitHub Issues y Projects son la fuente de verdad comunitaria |
| [`0003`](0003-hermes-as-whatsapp-group-adapter.md) | Aceptada | Hermes adapta el grupo; el backend conserva las decisiones verificables |
| [`0004`](0004-universal-game-client-with-expo.md) | Aceptada | Expo, React Native Web, TypeScript y SVG forman el cliente universal; la simulación queda aislada |
| [`0006`](0006-jev-backend-integration.md) | Aceptada | Jev solo decide tipado; el backend puntúa y orquesta; `packages/evaluation` posee rúbrica y scoring |

Al reemplazar una decisión, conserva el ADR anterior con estado `reemplazada` y enlaza el nuevo ADR.
