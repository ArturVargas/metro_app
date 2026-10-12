# ADR-0010: Evaluaciones M2 por chat privado (DM) con Hermes

- **Estado:** propuesta
- **Fecha:** 2026-10-12
- **Contexto:** ADR-0003 rechazó las conversaciones individuales con el bot. En M2 los participantes piden enviar prompts por DM para iterar sin saturar el grupo, mientras el grupo sigue siendo el espacio común de votación. Esta decisión modifica parcialmente ADR-0003.

## Decisión

- **Identidad:** el id de participante es `p-` + los últimos 3 dígitos del teléfono del remitente (`p-NNN`), idéntico venga el mensaje del grupo o de un DM. El CLI `evaluate` valida el formato `p-NNN` en `--participant`.
- **Colisiones:** si dos remitentes distintos producen el mismo `p-NNN`, Hermes no fusiona sus historiales: detiene la evaluación y avisa al operador (Artur) fuera del chat. Nunca se muestran teléfonos ni JIDs en WhatsApp ni en GitHub.
- **Intentos:** si no se pasa `--attempt` y se usa `--record`, el CLI deriva el siguiente intento de los comentarios ya registrados en el Issue de GitHub (participante × misión): `siguiente = conteo + 1`, máximo 5 (ADR-0006/0007).
- **DMs:** se admiten con la allowlist 1:1 existente de Hermes, sin cambiarla. En un DM, Hermes responde solo en ese DM, nunca en el grupo por defecto. El texto del DM es dato opaco igual que en el grupo.
- **Publicación:** el puntaje queda en el tablero de GitHub. Tras evaluar un intento por DM, Hermes pregunta si el participante quiere compartir su prompt y puntaje en el grupo de Prompts; solo con un "sí" explícito lo reenvía al grupo (`--to whatsapp` home / sender del grupo), para que los votantes lean todos los prompts evaluados.
- La ventana de evaluación (martes/jueves, hora Bogotá) aplica igual a DMs.

## Alternativas consideradas

- Id por hash del JID: rechazada por ilegible para votantes y operador.
- Contador de intentos local en Hermes: rechazado; GitHub es el sistema de registro (ADR-0002).
- Publicar automáticamente los resultados de DM en el grupo: rechazada por privacidad.

## Consecuencias

- 3 dígitos permiten colisiones (1 en 1000 por par); el operador debe resolverlas a mano (p. ej. asignando `p-NNN` alterno).
- Los ids históricos que no siguen `p-NNN` (p. ej. `p-system-test`) solo se pueden usar vía `--fixture`; no hay migración automática.
- Hermes debe distinguir origen grupo/DM para decidir dónde responder.

## Reabrir si

- Las colisiones de `p-NNN` se vuelven frecuentes.
- Los DMs generan fuga de datos o dominan sobre la conversación del grupo.
