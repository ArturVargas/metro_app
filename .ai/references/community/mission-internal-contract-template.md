# Plantilla del contrato interno de misión

## Cómo usar esta plantilla

Crea una copia de esta plantilla antes de publicar el brief de una misión. Este contrato configura la evaluación, la ejecución de las variantes y su trazabilidad en GitHub. Debe compartir identificador y versión con el brief público.

Completa únicamente decisiones ya aprobadas. Mantén los valores todavía abiertos como `PENDIENTE`; no los inventes. Si el brief público cambia después de publicarse, crea una versión nueva de ambos documentos.

## 1. Identidad

- **ID de misión:** `[mission-id]`
- **Versión:** `[número]`
- **Modalidad:** `prompt-ejecutado | participant-pr`
- **Estado:** `borrador | brief-publicado | evaluación | votación | selección | ejecución | resultados-publicados | cerrada`
- **Brief público:** `[ruta o URL]`
- **Responsable:** `[identificador]`
- **Zona horaria:** `PENDIENTE`
- **Evaluaciones:** `[martes a domingo, 06:00–23:55 America/Bogota]`
- **Selección:** `[votación M1–M2 | cola de PRs M3–M5]`
- **Publicación A/B/C:** `[viernes y hora]`

## 2. Evaluación

### Rúbrica versionada

| Criterio | Qué comprueba | Evidencia esperada | Peso |
| --- | --- | --- | ---: |
| `[criterio]` | `[condición evaluable]` | `[parte del prompt que la demuestra]` | `PENDIENTE` |

- **Total:** 100 puntos.
- **Umbral de elegibilidad:** `[≥70 para prompt-ejecutado | >80 para participant-pr]`.
- **Máximo:** cinco evaluaciones por participante.
- **Versión elegible:** solo se considera el intento más reciente y el SHA exacto asociado. Define la consecuencia según la modalidad.
- **Versión de la rúbrica:** `[id o ruta]`
- **Versión del prompt de feedback:** `[id o ruta]`
- **Proveedor y modelo de feedback:** `PENDIENTE`
- **Fallback de feedback:** `[plantilla versionada]`

En `prompt-ejecutado`, cada criterio evalúa la calidad del prompt frente al brief público. En `participant-pr`, cada criterio evalúa la correspondencia observable entre el prompt declarado y el código del SHA. Ninguna modalidad introduce requisitos que la comunidad no recibió.

## 3. Código base

- **Repositorio:** `[owner/repo]`
- **Commit base:** `[SHA inmutable]`
- **Rama base:** `[main para fase histórica | dev desde M3]`
- **Archivos o áreas permitidas:** `[rutas]`
- **Archivos o áreas protegidas:** `[rutas]`
- **Dependencias permitidas:** `[restricción]`
- **Comandos de instalación:** `[comandos]`
- **Comandos de validación:** `[comandos]`
- **Criterios públicos relacionados:** `[mapeo entre criterio y verificación]`

## 4. Ejecución A/B/C

### Modalidad `prompt-ejecutado`

Las tres variantes usan exactamente estos valores:

- **Agente y versión:** `[valor]`
- **Modelo:** `[valor]`
- **Nivel de razonamiento:** `[valor]`
- **Herramientas y permisos:** `[valor]`
- **Presupuesto o límite de ejecución:** `[valor]`
- **Tiempo máximo:** `[valor]`
- **Pruebas obligatorias:** `[lista]`
- **Criterios de aceptación:** `[lista]`
- **Aislamiento:** cada variante usa una rama o worktree independiente y no puede ver los resultados de las otras.

Registra cualquier interrupción o desviación. Una variante ejecutada bajo condiciones distintas no entra en la comparación hasta repetirse con el contrato correcto.

### Modalidad `participant-pr`

- Todos los participantes crean forks desde el mismo SHA de `dev` y abren PR hacia `dev`.
- A/B/C permanecen congeladas y no reciben commits de participantes.
- Una evaluación consume intento y se vincula con el HEAD actual del PR.
- Más de 80 y checks exitosos colocan el PR en la cola técnica.
- La revisión humana no modifica el puntaje y entrega findings sin parche.
- Los primeros tres PRs aprobados ocupan A, B y C por orden; no existe votación ni mapeo aleatorio.
- El equipo copia los commits aprobados a ramas controladas y realiza los despliegues.

## 5. GitHub

- **Issue principal de la misión:** `[URL]`
- **Project y vista:** `[URL]`
- **Campos obligatorios:** misión, versión, participante seudónimo, intento, prompt exacto, puntaje, elegibilidad, estado y fechas.
- **Comentarios por evaluación:** puntaje, feedback, versión de rúbrica y versión del generador de feedback.
- **Etiquetas:** `[misión]`, `[estado]`, `[elegible/no-elegible]`, `[A/B/C cuando corresponda]`.
- **Selección:** registra votos y desempate en `prompt-ejecutado`, o posición de cola y aprobación técnica en `participant-pr`.
- **Mapeo A/B/C:** conserva autor, prompt exacto, puntaje, intento, issue, fork, rama, pull request, commit y preview; registra si fue aleatorio o cronológico según modalidad.

GitHub usa identificadores seudónimos. No se almacenan números telefónicos ni secretos.

## 6. Publicación

- **Preview A:** `[URL]`
- **Preview B:** `[URL]`
- **Preview C:** `[URL]`
- **Prueba rápida común:** `[pasos para abrir, jugar y comprobar los criterios]`
- **Resultado de pruebas:** `[enlace a evidencia]`
- **Aprobación técnica:** `[responsable, fecha y estado]`
- **Riesgos conocidos:** `[lista breve]`
- **Procedimiento para revertir:** `[pasos o referencia]`
- **Mensaje del viernes:** `[ruta al mensaje preparado para WhatsApp]`

## Revisión antes de activar la misión

- El brief público y este contrato comparten ID y versión.
- Cada criterio público tiene una comprobación interna.
- Los pesos suman 100 y no revelan ni favorecen una implementación.
- El commit base es inmutable y las contribuciones comparables parten de ese mismo SHA.
- GitHub puede reconstruir todos los intentos y el mapeo final.
- Las pruebas, la aprobación técnica y la reversión tienen responsables claros.
