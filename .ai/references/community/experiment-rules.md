# Reglas del experimento comunitario

## Confirmado

### Misión y canal

- Existe una misión común para todas las personas del grupo.
- Cada misión tiene un brief público para participantes y un contrato interno para evaluación y ejecución.
- La rúbrica interna no se publica ni se usa para sugerir una solución técnica preferida.
- La interacción comunitaria ocurre en un grupo de WhatsApp.
- Hermes Agent monitorea el grupo y responde mensajes.
- Hermes actúa como adaptador y coordinador; las decisiones verificables pertenecen al backend.
- Hermes solo procesa una participación cuando la persona menciona explícitamente al bot.
- Las evaluaciones están disponibles únicamente los martes y jueves.
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

### Elegibilidad y votación

- Una propuesta necesita al menos 70 puntos para entrar a la votación final.
- La puntuación solo determina elegibilidad; no ordena candidatos ni resuelve empates.
- Solo se considera el intento más reciente de cada participante. Si ese intento obtiene menos de 70 puntos, el participante no entra en la votación (no se rescata un intento anterior ≥70).
- Cada miembro elige tres prompts distintos y no puede votar por el propio.
- Cada candidato muestra autor, texto completo y puntuación durante la votación.
- El diseño aprobado requiere mantener los votos ocultos hasta el cierre.
- Un empate que afecte el tercer puesto se resuelve con una ronda adicional entre los empatados.

### Variantes

- La comunidad selecciona tres prompts.
- Los tres se asignan aleatoriamente a A, B y C.
- El mapeo conserva participante, texto exacto, puntuación, intento, misión, issue, rama, pull request y preview.
- Cada variante parte del mismo commit y usa el mismo agente, modelo, razonamiento, herramientas, permisos, presupuesto, pruebas y criterios de aceptación.
- Las variantes no acceden a los resultados de las otras.
- La primera ejecución será supervisada.
- Integrar una variante al producto requiere aprobación técnica del responsable.

### Hosting y promoción de A/B/C

- Las previews del viernes se hospedan en Cloudflare (Pages o equivalente).
- A, B y C son ranuras permanentes durante el experimento, con URLs estables (subdominios o rutas).
- Cada misión redespliega las tres ranuras desde el mismo commit baseline bajo condiciones equivalentes y sobrescribe el build anterior de esa ranura.
- Cada letra queda vinculada a autor, texto exacto del prompt, issue, rama, pull request y preview.
- No hay promoción automática al baseline por tráfico ni por una segunda votación de popularidad.
- Promover una variante como baseline de la siguiente misión requiere decisión del responsable de producto con checklist breve: jugable, no rompe las reglas y feedback cualitativo del viernes.
- Telemetría ligera opcional puede informar esa decisión; no la decide.
- El mensaje al grupo presenta tres enlaces el viernes; ninguno se vuelve definitivo automáticamente.

## Abierto

- Resolver cómo mantener los votos ocultos si toda la interacción debe permanecer dentro del grupo; las encuestas nativas muestran conteos en tiempo real y admiten hasta doce opciones.
- Definir horarios y zona horaria para abrir y cerrar evaluaciones, votación y publicación de resultados.
- Definir los nombres definitivos de los comandos de Hermes.
- Definir la fórmula y pesos exactos de la rúbrica de 100 puntos.
- Elegir el proveedor y modelo del LLM ligero.

## Rechazado o reemplazado

- PostgreSQL como fuente de verdad inicial: reemplazado por GitHub Issues y Projects.
- El LLM como evaluador o juez de la puntuación: rechazado; Jev y el backend poseen esa responsabilidad.
- Usar la puntuación para escoger los tres prompts: rechazado; la comunidad los elige.
