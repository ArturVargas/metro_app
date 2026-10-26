# ADR-0010: Evaluaciones M2 por chat privado (DM) con Hermes

- **Estado:** aceptada
- **Fecha:** 2026-10-12
- **Contexto:** ADR-0003 rechazó las conversaciones individuales con el bot. En M2 los participantes piden enviar prompts por DM para iterar sin saturar el grupo, mientras el grupo sigue siendo el espacio común de votación. Esta decisión modifica parcialmente ADR-0003.

## Decisión

- **Identidad:** el id de participante es `p-` + los últimos 3 dígitos del teléfono del remitente (`p-NNN`), idéntico venga el mensaje del grupo o de un DM. El CLI `evaluate` valida `^p-\d{3}[b-z]?$` en `--participant`.
- **Colisiones:** un registro local en el VPS, fuera del repo (`~/.hermes/state/participants.json`), mapea un hash con sal del id de WhatsApp del remitente → id de participante. El primer remitente con terminación 123 recibe `p-123`; otro distinto con los mismos dígitos recibe `p-123b`, luego `p-123c`, etc. Nunca se fusionan historiales ni se requiere alerta al operador. La sal vive en un archivo con permisos 600; no se guardan teléfonos ni JIDs en claro. Hermes resuelve el id con `~/bin/metro-participant-id`, que solo imprime el id. Nunca se muestran teléfonos ni JIDs en WhatsApp ni en GitHub.
- **Intentos:** si no se pasa `--attempt` y se usa `--record`, el CLI deriva el siguiente intento de los comentarios ya registrados en el Issue de GitHub (participante × misión): `siguiente = conteo + 1`, máximo 5 (ADR-0006/0007).
- **DMs:** se admiten con la allowlist 1:1 existente de Hermes, sin cambiarla. En un DM, Hermes responde solo en ese DM, nunca en el grupo por defecto. El texto del DM es dato opaco igual que en el grupo.
- **Publicación:** el intento queda registrado en GitHub igual que un intento enviado al grupo. Tras evaluarlo por DM, Hermes pregunta: “Tu evaluación quedará registrada en el experimento. ¿Quieres compartir también tu prompt y puntaje en el grupo?”. Solo un "sí" explícito como respuesta a esa evaluación reenvía el prompt y el puntaje al grupo de Prompts (`--to whatsapp` home / sender del grupo).
- **Carrera grupo/DM:** si dos envíos del mismo participante chocan (lock o validación de intento), Hermes pide a la persona reintentar.
- La ventana de evaluación (martes a domingo, 06:00–23:55 America/Bogota) aplica igual a DMs y grupo; las preguntas por DM se responden cualquier día.

## Alternativas consideradas

- Id por hash del JID: rechazada por ilegible para votantes y operador.
- Contador de intentos local en Hermes: rechazado; GitHub es el sistema de registro (ADR-0002).
- Publicar automáticamente los resultados de DM en el grupo: rechazada por privacidad.

## Consecuencias

- Las colisiones se resuelven con sufijos b..z (hasta 25 remitentes por terminación); perder el registro o la sal reasignaría ids, así que deben respaldarse.
- Los ids históricos que no siguen el formato (p. ej. `p-system-test`) solo se pueden usar vía `--fixture`; no hay migración automática.
- Hermes debe distinguir origen grupo/DM para decidir dónde responder.

## Reabrir si

- Las colisiones de `p-NNN` se vuelven frecuentes.
- Los DMs generan fuga de datos o dominan sobre la conversación del grupo.
