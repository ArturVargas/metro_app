# Reglas del experimento comunitario

## Confirmado

### Misión y canal

- Existe una misión común para todas las personas del grupo.
- Cada misión tiene un brief público para participantes y un contrato interno para evaluación y ejecución.
- El brief público enlaza una versión Base desplegada y común para todas las personas.
- La rúbrica interna no se publica ni se usa para sugerir una solución técnica preferida.
- Las misiones posteriores pueden dar menos ejemplos y dejar más decisiones al participante, pero nunca ocultar un requisito usado para evaluar elegibilidad.
- La interacción comunitaria ocurre en el grupo de WhatsApp y, para participantes autorizados, también por DM con Hermes.
- Hermes Agent monitorea el grupo y responde los DM de la allowlist existente.
- Hermes actúa como adaptador y coordinador; las decisiones verificables pertenecen al backend.
- En el grupo, Hermes solo procesa una participación cuando la persona menciona explícitamente al bot. En DM, una consulta no consume intento; un prompt enviado para evaluación sí sigue el flujo normal.
- Cada intento evaluado por DM se registra como los intentos del grupo. Después, Hermes pregunta: “Tu evaluación quedará registrada en el experimento. ¿Quieres compartir también tu prompt y puntaje en el grupo?”. Solo un “sí” explícito comparte ese intento en el grupo.
- Las evaluaciones están disponibles únicamente de martes a domingo, de 6:00 a 23:55 (hora Colombia; lunes cerrado).
- Cada viernes se publican tres enlaces correspondientes a las versiones A, B y C para que el grupo pueda probarlas, compararlas y compartirlas.
- La incorporación se entrega como una secuencia de mensajes cortos y una guía fija en el grupo.
- La comunicación para participantes habla de evaluación de calidad y feedback; no menciona Jev ni detalles internos del evaluador.

### Evaluación

- Límite: **5 evaluaciones por misión por participante** (contador individual; no es un tope de 5 para la misión ni para el grupo).
- TypeSafe Jev evalúa los criterios de una rúbrica versionada.
- El backend convierte los criterios en una puntuación de 0 a 100.
- El LLM ligero redacta feedback breve y estructurado; no puede cambiar la puntuación ni añadir criterios.
- El feedback muestra la puntuación, una fortaleza concreta, hasta dos problemas prioritarios, sugerencias accionables y una pregunta de revisión.
- Si el LLM falla o entrega un formato inválido, se usa feedback basado en plantillas.
- Se registran proveedor, modelo y versión del prompt de feedback.
- Durante el piloto, el modo operativo es feedback determinista (`FEEDBACK_MODE=stub`). El LLM local no se conecta a Hermes hasta que se defina y pruebe una frontera donde el prompt del participante no pueda controlar el contenido publicado.

### Elegibilidad y votación — Misiones 1 y 2

- Una propuesta necesita al menos 70 puntos para entrar a la votación final.
- La puntuación solo determina elegibilidad; no ordena candidatos ni resuelve empates.
- Solo se considera el intento más reciente de cada participante. Si ese intento obtiene menos de 70 puntos, el participante no entra en la votación (no se rescata un intento anterior ≥70).
- Cada miembro elige tres prompts distintos y no puede votar por el propio.
- Cada candidato muestra autor, texto completo y puntuación durante la votación.
- El diseño aprobado requiere mantener los votos ocultos hasta el cierre.
- Un empate que afecte el tercer puesto se resuelve con una ronda adicional entre los empatados.

### Variantes — Misiones 1 y 2

- La comunidad selecciona tres prompts.
- Los tres se asignan aleatoriamente a A, B y C.
- El mapeo conserva participante, texto exacto, puntuación, intento, misión, issue, rama, pull request y preview.
- Cada variante parte del mismo commit y usa el mismo agente, modelo, razonamiento, herramientas, permisos, presupuesto, pruebas y criterios de aceptación.
- Las variantes no acceden a los resultados de las otras.
- La primera ejecución será supervisada.
- Integrar una variante al producto requiere aprobación técnica del responsable.

### Contribuciones de código — Misiones 3, 4 y 5

- `dev` es la rama base controlada por el equipo. Cada misión fija y publica un SHA inmutable de `dev`.
- Cada participante trabaja desde un fork y abre su PR hacia `dev`; no trabaja directamente sobre `main`, A, B o C.
- A/B/C permanecen congeladas durante la recepción. Solo el equipo puede actualizar sus ramas y despliegues.
- El PR incluye prompt exacto, código, pruebas, limitaciones y una declaración de cambios `LLM`, `manual` o `combinado`.
- Una evaluación pertenece al SHA exacto del PR y consume uno de los cinco intentos. Actualizar sin solicitar evaluación no consume intento.
- Solo cuenta la evaluación más reciente. El participante puede corregir con su LLM o manualmente y pedir otra evaluación mientras conserve intentos.
- Jev puntúa la correspondencia entre prompt y código. El umbral es **mayor que 80**, no `≥80`.
- Con más de 80 y checks exitosos, el PR entra a revisión humana. La revisión valida seguridad, funcionamiento, alcance y evidencia sin cambiar el puntaje.
- Nuestro feedback describe el fallo y su reproducción; no entrega el parche ni una receta de implementación.
- La cola técnica se ordena por la hora en que el mismo SHA supera Jev y checks.
- Los primeros tres PRs que también aprueban la revisión humana ocupan A, B y C, en ese orden. No hay votación ni asignación aleatoria.
- Un cambio posterior al SHA evaluado requiere otra evaluación y una nueva posición en la cola.
- Los PRs restantes se conservan como evidencia aunque después superen 80.
- Solo el responsable de producto decide qué resultado alimenta el siguiente baseline de `dev`.

### Findings de ejecución

- La revisión de una variante mide fidelidad entre prompt y resultado; no recalifica el prompt.
- Cada diferencia se registra como `prompt-gap`, `execution-gap`, `platform-gap` o `security-blocker`, con evidencia reproducible.
- Un finding no crea un intento, no consume el límite de cinco y no modifica el puntaje de TypeSafe.
- El código generado se conserva inicialmente como evidencia del experimento.
- Antes de publicar solo es obligatorio corregir un `security-blocker` o un fallo que impida desplegar o probar la variante.
- Los findings se convierten en feedback para el participante distinguiendo claramente la calidad del prompt de la fidelidad del agente.
- En una variante compuesta, cada participante recibe únicamente los findings relacionados con sus requisitos de origen.

### Hosting y promoción de A/B/C

- Las previews del viernes se hospedan en Cloudflare (Pages o equivalente).
- A, B y C son ranuras permanentes durante el experimento, con URLs estables (subdominios o rutas).
- Cada misión redespliega las tres ranuras desde el mismo commit baseline bajo condiciones equivalentes y sobrescribe el build anterior de esa ranura.
- Cada letra queda vinculada a autor, texto exacto del prompt, issue, rama, pull request y preview.
- No hay promoción automática al baseline por tráfico ni por una segunda votación de popularidad.
- Promover una variante como baseline de la siguiente misión requiere decisión del responsable de producto con checklist breve: jugable, no rompe las reglas y feedback cualitativo del viernes.
- Telemetría ligera opcional puede informar esa decisión; no la decide.
- El mensaje al grupo presenta tres enlaces el viernes; ninguno se vuelve definitivo automáticamente.
- Desde Misión 3, “mismo baseline” significa el SHA de `dev` publicado para la misión. El equipo copia los tres commits aprobados a ramas controladas antes de desplegar.

## Abierto

- Resolver cómo mantener los votos ocultos si toda la interacción debe permanecer dentro del grupo; las encuestas nativas muestran conteos en tiempo real y admiten hasta doce opciones.
- Definir el horario de votación de M1–M2 y los horarios de selección y publicación de resultados por modalidad.
- Definir los nombres definitivos de los comandos de Hermes.
- Definir la fórmula y pesos exactos de la rúbrica de 100 puntos.
- Elegir el proveedor y modelo del LLM ligero.
- Elegir qué resultado de Misión 2 origina el primer baseline de `dev`.
- Definir y calibrar la rúbrica Jev de correspondencia prompt↔código para Misión 3.
- Definir el calendario exacto de las Misiones 3, 4 y 5.

## Rechazado o reemplazado

- PostgreSQL como fuente de verdad inicial: reemplazado por GitHub Issues y Projects.
- El LLM como evaluador o juez de la puntuación: rechazado; Jev y el backend poseen esa responsabilidad.
- Usar la puntuación para escoger los tres prompts: rechazado; la comunidad los elige.
- Desde Misión 3, la votación de prompts y la ejecución central quedan reemplazadas por forks, PRs y los primeros tres PRs que superen >80, checks y revisión técnica.
