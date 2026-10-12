# ADR-0003: Hermes como adaptador del grupo de WhatsApp

- **Estado:** aceptada
- **Fecha:** 2026-09-28
- **Contexto:** todas las personas trabajan sobre la misma misión y la interacción ocurre dentro de un grupo de WhatsApp existente.

## Decisión

Hermes Agent monitorea el grupo, identifica al participante y comunica mensajes al backend. Después de los chequeos mecánicos de admisión, el primer procesamiento semántico del prompt ocurre en TypeSafe: Hermes transmite el texto como dato y no interpreta ni ejecuta sus instrucciones. El backend valida intentos, llama a Jev y al LLM, calcula el resultado y persiste en GitHub. Hermes publica en el grupo la respuesta estructurada que recibe; no modifica puntajes ni toma decisiones de elegibilidad.

La interfaz requiere una mención explícita al bot para separar acciones del experimento de la conversación normal. Hermes solo procesa evaluaciones los martes, miércoles y jueves de 06:00 a 23:55 (America/Bogota); ver ADR-0010. Los nombres exactos de comandos adicionales se definirán antes de implementar.

## Alternativas consideradas

- Integración directa con Twilio o Meta: aplazada porque Hermes ya resuelve la entrada al grupo.
- Evaluación dentro del propio razonamiento libre de Hermes: rechazada por falta de reproducibilidad y auditoría.
- Conversaciones individuales con el bot: rechazada inicialmente; **modificada por [ADR-0010](0010-hermes-dm-evaluations.md)**: participantes autorizados pueden consultar y evaluar por DM, mientras el grupo sigue siendo el espacio común de publicación y votación.

## Consecuencias

- El contrato Hermes-backend debe ser estructurado y validado.
- La misión, rúbrica, brief, identidad, intento y persistencia pertenecen al backend; el prompt del participante no puede reemplazarlos.
- La integración Baileys de Hermes usa una API no oficial y presenta riesgo de restricción de cuenta.
- Se necesita limitar el grupo admitido, los participantes y las acciones que activan herramientas.
- Los fallos de Hermes no deben corromper intentos ni duplicar evaluaciones.

## Reabrir si

- WhatsApp restringe la cuenta o cambia el protocolo usado por Baileys.
- Hermes no entrega de forma estable la identidad del participante o los eventos de grupo.
- Se obtiene acceso confiable a una integración oficial que cubra el grupo requerido.
