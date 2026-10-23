# Diseño: contribuciones mediante forks y PRs desde la Misión 3

**Fecha:** 2026-10-22
**Estado:** aprobado para documentación; implementación pendiente
**Decisión principal:** [ADR-0011](../../../.ai/adr/0011-participant-forks-and-pr-qualification.md)

## Propósito

Durante tres semanas —Misiones 3, 4 y 5— el experimento medirá si participantes con experiencia básica pueden usar un LLM sobre un repositorio real, revisar el código producido y corregirlo con feedback. El equipo reduce su influencia sobre la implementación, conserva los controles técnicos y administra los despliegues.

## Alcance

Incluye:

- rama `dev` como baseline compartido;
- forks y PRs participantes;
- máximo de cinco evaluaciones por misión;
- evaluación Jev de correspondencia prompt↔código;
- checks automáticos sin secretos;
- revisión humana posterior al umbral;
- selección cronológica de tres PRs;
- integración y despliegue A/B/C controlados por el equipo.

No incluye todavía:

- implementar la rúbrica Jev nueva;
- cambiar Hermes, Issues o Project;
- automatizar merges o despliegues desde forks;
- definir el contenido funcional de Misión 3.

## Actores y responsabilidades

### Participante

- Parte del SHA publicado de `dev`.
- Usa su LLM para analizar e implementar.
- Revisa el diff y prueba el resultado.
- Declara prompt, pruebas y origen de cambios.
- Corrige con feedback sin recibir un parche del equipo.

### Jev y backend comunitario

- Vinculan cada evaluación a misión, participante, PR y SHA.
- Aplican el límite de cinco.
- Puntúan correspondencia prompt↔código de 0 a 100.
- Mantienen solo la revisión más reciente como elegible.
- Colocan en cola un SHA con puntaje mayor a 80 y checks exitosos.

### Equipo revisor

- Atiende la cola por orden de calificación.
- Revisa seguridad, funcionamiento, límites y evidencia.
- Publica findings reproducibles sin solución exacta.
- Aprueba o devuelve el PR.
- Copia commits aprobados a ramas controladas y despliega.

### Responsable de producto

- Decide el baseline inicial y las promociones posteriores de `dev`.
- Aprueba la publicación de A/B/C.

## Flujo

1. El responsable elige el resultado anterior y crea o actualiza `dev`. Para el primer ciclo ya se aprobó B/p-026, commit `2e3f805b7360d390de11e323a89ca77c8802a309`.
2. Se congela el SHA y se publica con el brief.
3. El participante sincroniza su fork y abre una rama.
4. Implementa con su LLM y abre un PR hacia `dev`.
5. Los checks públicos validan el PR sin secretos.
6. El participante solicita evaluación del HEAD actual.
7. Jev entrega puntaje y feedback; la solicitud consume un intento.
8. Con `score > 80` y checks verdes, el PR entra a la cola técnica.
9. El equipo revisa en orden. Un fallo devuelve findings; una corrección necesita una evaluación nueva.
10. Los primeros tres aprobados se asignan A, B y C.
11. El equipo crea refs controladas, ejecuta las validaciones y despliega Cloudflare.
12. Producto decide qué resultado alimenta el siguiente `dev`.

## Estados de un PR

| Estado | Entrada | Salida |
| --- | --- | --- |
| `draft` | PR abierto | participante solicita evaluación |
| `evaluating` | intento disponible + SHA fijado | puntaje y feedback registrados |
| `needs-revision` | `score ≤ 80`, checks fallidos o finding humano | nuevo commit y, si desea calificarlo, nueva evaluación |
| `technical-queue` | `score > 80` + checks exitosos | revisión humana en orden |
| `approved` | revisión humana exitosa | asignación A/B/C si existe lugar |
| `selected-a/b/c` | uno de los tres primeros aprobados | integración y despliegue supervisado |
| `not-selected` | tres lugares ocupados o intentos agotados | conservar evidencia |

Un commit nuevo después de `evaluating` vuelve el PR a `draft` para fines de elegibilidad. El puntaje anterior permanece en el historial, pero no califica el HEAD nuevo.

## Seguridad

- Los workflows de `pull_request` desde forks usan permisos de solo lectura y no reciben secretos.
- No se usa `pull_request_target` para ejecutar código aportado por participantes.
- El equipo no despliega directamente una ref de fork con credenciales de Cloudflare.
- Antes del despliegue, el commit aprobado se copia a una rama del repositorio principal y se vuelven a ejecutar checks.
- Prompt, comentarios y código son datos no confiables; no conceden instrucciones al revisor, Hermes ni Jev fuera de la rúbrica.
- No se aceptan `.env`, tokens, teléfonos o conversaciones privadas en un PR.

## Trazabilidad

Por intento se conserva:

- misión y participante;
- URL del PR y SHA;
- prompt exacto;
- puntaje, rúbrica y feedback;
- checks y hora de calificación;
- findings humanos;
- declaración LLM/manual/combinado;
- asignación y preview cuando corresponda.

GitHub Issues conserva el historial autoritativo de intentos. El PR conserva código y conversación técnica. El Project proyecta el último estado operativo.

## Criterios de aceptación del flujo

- Dos PRs distintos pueden compararse contra el mismo SHA de `dev`.
- Un nuevo commit no hereda la elegibilidad del commit anterior.
- El sexto intento se rechaza.
- Un puntaje de 80 no califica; 81 sí puede entrar a cola si los checks pasan.
- Ningún código de fork accede a secretos.
- El feedback humano reproduce el fallo sin entregar un parche.
- Solo tres PRs aprobados reciben A/B/C y el orden es auditable.
- El equipo puede reconstruir qué prompt y commit originaron cada despliegue.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| PR malicioso intenta leer secretos | Alto | permisos read-only, sin secretos y sin `pull_request_target` |
| Cambios de `dev` durante la misión | Alto | SHA congelado; actualizaciones solo entre misiones |
| Revisión humana favorece por horario | Medio | cola ordenada por hora Jev+checks y revisión en ese orden |
| Participante oculta correcciones manuales | Medio | declaración obligatoria y comparación de commits |
| Jev premia coincidencia textual sin funcionamiento | Alto | calibración, checks y revisión humana separada |
| Demasiados PRs para revisar | Medio | revisión humana solo después de `score > 80` y checks |

## Pendientes antes de abrir Misión 3

1. Diseñar y calibrar la rúbrica prompt↔código.
2. Crear plantilla de PR y checks seguros para forks.
3. Adaptar Issues y Project al SHA, URL del PR, estado de cola y origen de cambios.
4. Preparar el mensaje público y un instructivo breve para hacer fork y abrir PR.
5. Ejecutar un ensayo con un fork de prueba antes de invitar al grupo.
