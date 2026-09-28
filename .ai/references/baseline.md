# Línea base del proyecto

## Estado actual

El repositorio contiene el AI Engineering Kit y los primeros documentos de Metro App. Todavía no existe código de aplicación, infraestructura desplegada ni dependencias de producto instaladas.

## Arquitectura y despliegue

La arquitectura se encuentra en definición. Está confirmado que el juego y la comunidad compartirán repositorio, pero funcionarán y se desplegarán por separado.

## Integraciones confirmadas

- TypeSafe Jev para evaluar criterios de los prompts.
- Un LLM ligero para redactar feedback sin alterar la puntuación.
- GitHub Issues y Projects como fuente de verdad comunitaria.
- Hermes Agent como adaptador del grupo de WhatsApp.
- PostHog como requisito de analítica de sesiones de juego.
- Observabilidad de errores como requisito; el proveedor definitivo sigue abierto.

## Riesgos conocidos

- La integración de Hermes mediante Baileys usa una API no oficial de WhatsApp y puede ocasionar restricciones de cuenta.
- GitHub no ofrece transacciones de base de datos; el backend debe serializar evaluaciones e impedir duplicados.
- La votación exclusivamente dentro del grupo entra en conflicto con mantener votos ocultos hasta el cierre.

## Próxima decisión

Definir si la votación dentro del grupo será pública o si se permitirá un canal auxiliar para ocultar votos.
