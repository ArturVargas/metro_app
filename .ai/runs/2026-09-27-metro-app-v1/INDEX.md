# Iniciativa: Metro App v1

- **Clasificación:** architectural.
- **Estado:** arquitectura en definición.
- **Objetivo actual:** cerrar la arquitectura del juego y del experimento comunitario antes de escribir el plan de implementación.

## Entradas

- [Product Brief aprobado](../../../docs/superpowers/specs/2026-09-27-metro-app-product-brief-design.md).
- [Architecture intake](architecture-intake.yaml).
- [Reglas comunitarias vigentes](../../references/community/experiment-rules.md).
- [Mapa del sistema](../../references/architecture/system-map.md).

## Decisiones cerradas

- Pipeline Jev + LLM y umbral de elegibilidad.
- Comparación A/B/C bajo condiciones iguales.
- GitHub como fuente de verdad comunitaria.
- Hermes como adaptador del grupo de WhatsApp.
- Identidad seudónima sin teléfonos en GitHub.
- Incorporación mediante mensajes breves y guía fija, sin exponer Jev a los participantes.
- Texto completo de incorporación y guía fijada para el grupo.
- Separación de cada misión en brief público y contrato interno.
- Plantilla del brief público con siete bloques variables y un pie fijo de participación.
- Plantilla del contrato interno con identidad, evaluación, código base, ejecución A/B/C, GitHub y publicación.
- Definir y crear un baseline técnico neutral antes de redactar la Misión 1.

## Próxima decisión

Elegir el stack del cliente multiplataforma y después cerrar el contenido exacto del baseline técnico.

## Skills relacionados

- `architecture-workflow` mientras existan decisiones de componentes o integraciones.
- `superpowers:brainstorming` para comportamiento o alcance todavía ambiguo.
- `superpowers:writing-plans` solo después de aprobar la arquitectura escrita.
