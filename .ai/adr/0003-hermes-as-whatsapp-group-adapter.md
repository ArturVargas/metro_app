# ADR-0003: Hermes como adaptador del grupo de WhatsApp

- **Estado:** aceptada
- **Fecha:** 2026-09-28
- **Contexto:** todas las personas trabajan sobre la misma misión y la interacción ocurre dentro de un grupo de WhatsApp existente.

## Decisión

Hermes Agent monitorea el grupo, identifica al participante y comunica mensajes al backend. El backend valida intentos, llama a Jev y al LLM, calcula el resultado y persiste en GitHub. Hermes publica en el grupo la respuesta estructurada que recibe; no modifica puntajes ni toma decisiones de elegibilidad.

La interfaz usará comandos o menciones explícitas para separar acciones del experimento de la conversación normal. Los nombres exactos de los comandos se definirán antes de implementar.

## Alternativas consideradas

- Integración directa con Twilio o Meta: aplazada porque Hermes ya resuelve la entrada al grupo.
- Evaluación dentro del propio razonamiento libre de Hermes: rechazada por falta de reproducibilidad y auditoría.
- Conversaciones individuales con el bot: rechazada; el experimento debe ocurrir en el grupo común.

## Consecuencias

- El contrato Hermes-backend debe ser estructurado y validado.
- La integración Baileys de Hermes usa una API no oficial y presenta riesgo de restricción de cuenta.
- Se necesita limitar el grupo admitido, los participantes y las acciones que activan herramientas.
- Los fallos de Hermes no deben corromper intentos ni duplicar evaluaciones.

## Reabrir si

- WhatsApp restringe la cuenta o cambia el protocolo usado por Baileys.
- Hermes no entrega de forma estable la identidad del participante o los eventos de grupo.
- Se obtiene acceso confiable a una integración oficial que cubra el grupo requerido.
