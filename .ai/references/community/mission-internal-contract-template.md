# Plantilla del contrato interno de misión

## Cómo usar esta plantilla

Crea una copia de esta plantilla antes de publicar el brief de una misión. Este contrato configura la evaluación, la ejecución de las variantes y su trazabilidad en GitHub. Debe compartir identificador y versión con el brief público.

Completa únicamente decisiones ya aprobadas. Mantén los valores todavía abiertos como `PENDIENTE`; no los inventes. Si el brief público cambia después de publicarse, crea una versión nueva de ambos documentos.

## 1. Identidad

- **ID de misión:** `[mission-id]`
- **Versión:** `[número]`
- **Estado:** `borrador | brief-publicado | evaluación | votación | ejecución | resultados-publicados | cerrada`
- **Brief público:** `[ruta o URL]`
- **Responsable:** `[identificador]`
- **Zona horaria:** `PENDIENTE`
- **Evaluaciones:** `[martes y jueves, con horarios pendientes]`
- **Votación:** `[inicio y cierre]`
- **Publicación A/B/C:** `[viernes y hora]`

## 2. Evaluación

### Rúbrica versionada

| Criterio | Qué comprueba | Evidencia esperada | Peso |
| --- | --- | --- | ---: |
| `[criterio]` | `[condición evaluable]` | `[parte del prompt que la demuestra]` | `PENDIENTE` |

- **Total:** 100 puntos.
- **Umbral de elegibilidad:** 70 puntos.
- **Máximo:** cinco evaluaciones por participante.
- **Versión elegible:** la versión calificable más reciente con 70 puntos o más.
- **Versión de la rúbrica:** `[id o ruta]`
- **Versión del prompt de feedback:** `[id o ruta]`
- **Proveedor y modelo de feedback:** `PENDIENTE`
- **Fallback de feedback:** `[plantilla versionada]`

Cada criterio debe evaluar la calidad del prompt frente al brief público. No debe premiar una solución técnica preferida ni introducir requisitos que la comunidad no recibió.

## 3. Código base

- **Repositorio:** `[owner/repo]`
- **Commit base:** `[SHA inmutable]`
- **Archivos o áreas permitidas:** `[rutas]`
- **Archivos o áreas protegidas:** `[rutas]`
- **Dependencias permitidas:** `[restricción]`
- **Comandos de instalación:** `[comandos]`
- **Comandos de validación:** `[comandos]`
- **Criterios públicos relacionados:** `[mapeo entre criterio y verificación]`

## 4. Ejecución A/B/C

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

## 5. GitHub

- **Issue principal de la misión:** `[URL]`
- **Project y vista:** `[URL]`
- **Campos obligatorios:** misión, versión, participante seudónimo, intento, prompt exacto, puntaje, elegibilidad, estado y fechas.
- **Comentarios por evaluación:** puntaje, feedback, versión de rúbrica y versión del generador de feedback.
- **Etiquetas:** `[misión]`, `[estado]`, `[elegible/no-elegible]`, `[A/B/C cuando corresponda]`.
- **Selección:** registra votos válidos, desempate si aplica y los tres prompts ganadores.
- **Mapeo aleatorio:** conserva para A, B y C el autor, prompt exacto, puntaje, intento, issue, rama, pull request, commit y preview.

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
- El commit base es inmutable y las condiciones A/B/C son idénticas.
- GitHub puede reconstruir todos los intentos y el mapeo final.
- Las pruebas, la aprobación técnica y la reversión tienen responsables claros.
