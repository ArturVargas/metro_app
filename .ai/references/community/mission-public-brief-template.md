# Plantilla del brief público de misión

## Cómo usar esta plantilla

Completa este documento antes de publicar una misión en el grupo de WhatsApp. Los primeros siete bloques cambian para cada misión. Conserva el bloque final sin cambios para que las reglas de participación sean consistentes.

No incluyas la rúbrica interna, los pesos de evaluación ni una solución técnica prescrita. Escribe para participantes con experiencia básica o sin experiencia en programación.

## Contenido variable

### 🎯 Misión [número]: [título]

**El problema**  
[Explica en lenguaje sencillo qué experimenta actualmente el jugador.]

**El objetivo**  
[Describe un resultado observable sin indicar cómo implementarlo.]

**Contexto**  
[Incluye el enlace estable a la versión Base, el estado actual del producto y las imágenes o reglas necesarias para entender la misión.]

**Puedes cambiar**

- [Elemento dentro del alcance.]
- [Elemento dentro del alcance.]

**Debe mantenerse**

- [Comportamiento o restricción que no debe cambiar.]
- [Comportamiento o restricción que no debe cambiar.]

**Estará listo cuando**

- [Resultado observable 1.]
- [Resultado observable 2.]
- [Resultado observable 3.]

Usa entre tres y cinco criterios. Cada criterio debe poder comprobarse al jugar o revisar la versión resultante.

## Pie fijo de participación — Misiones 1 y 2

**Cómo participar**

- Envía tu prompt en este grupo mencionando al bot, únicamente de martes a domingo, de 6:00 a 23:55 (hora Colombia; lunes cerrado).
- Puedes evaluarlo hasta cinco veces y recibirás un puntaje y feedback en cada intento.
- Solo tu último prompt con un puntaje de 70 o más participará en la votación.

**Entrega del viernes**  
Los tres prompts elegidos por el grupo se convertirán en las versiones A, B y C. El viernes compartiremos sus enlaces para que puedan probarlas, compararlas y compartir sus resultados.

## Pie fijo de participación — Misiones 3, 4 y 5

**Cómo participar**

- Actualiza tu fork desde el commit de `dev` indicado en esta misión y crea una rama propia.
- Usa tu LLM para analizar el repositorio e implementar el objetivo.
- Abre un PR hacia `dev` e incluye tu prompt exacto, las pruebas realizadas y qué partes fueron generadas, corregidas manualmente o combinadas.
- Puedes solicitar hasta cinco evaluaciones. Cada evaluación corresponde al commit actual de tu PR.
- Para calificar, la revisión actual necesita más de 80 puntos, checks exitosos y aprobación técnica.
- Si recibes findings, corrige tu PR y solicita otra evaluación; no se te entregará el parche.

**Entrega de resultados**
Los primeros tres PRs que pasen todos los controles se convertirán, en orden, en A, B y C. El equipo administrará su integración y despliegue para que el grupo pueda probarlos y compararlos.

## Revisión antes de publicar

- El número, título, identificador y versión coinciden con el contrato interno.
- El problema y el objetivo se entienden sin conocimiento técnico.
- El alcance y los límites no se contradicen.
- Los criterios describen resultados y no una implementación específica.
- Todos los enlaces y referencias funcionan.
- La versión Base desplegada corresponde al commit indicado en el contrato interno.
- El pie fijo corresponde a la modalidad declarada por el contrato interno y conserva sus reglas aprobadas.
