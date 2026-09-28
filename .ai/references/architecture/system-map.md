# Mapa del sistema

## Posicionamiento

Metro App contiene dos productos operativamente independientes dentro del mismo repositorio:

1. Un juego web y móvil cuya simulación ocurre en el dispositivo.
2. Un sistema comunitario que evalúa prompts, coordina votación y genera tres variantes del producto.

Una falla del sistema comunitario no debe impedir jugar. Una partida no necesita consultar el backend comunitario.

## Componentes confirmados

### Juego

- Cliente universal con motor de simulación local y determinista.
- Dataset de demanda preprocesado y versionado.
- PostHog para análisis de sesiones de juego.
- Servicio de observabilidad de errores por definir.

### Comunidad

- Hermes Agent como adaptador del grupo de WhatsApp.
- Backend sin base de datos relacional propia.
- TypeSafe Jev como evaluador tipado.
- LLM ligero como redactor de feedback.
- GitHub Issues y Projects como fuente de verdad y auditoría.
- GitHub como origen de issues, ramas, pull requests y previews A/B/C.

## Límites

- Hermes transmite identidad seudónima, mensaje y contexto de misión; no calcula puntajes.
- El backend valida intentos, ejecuta la evaluación, calcula la puntuación y persiste el resultado.
- Jev devuelve decisiones estructuradas; no redacta feedback.
- El LLM recibe los hallazgos ya calculados y no puede alterar el resultado.
- GitHub conserva prompts, intentos, feedback, estados, selección y mapeo de variantes.
- El agente de código trabaja sobre ramas aisladas creadas desde el mismo commit.

## Estructura prevista del repositorio

```text
apps/
  game/              Expo y React Native Web; propuesta pendiente de consolidación
  community/         API para Hermes, Jev, LLM y GitHub
packages/
  evaluation/        rúbrica, puntaje, contratos y validación
.ai/                 contexto, decisiones, ADRs e iniciativas
```

## Secuencia de arranque

Antes de redactar la Misión 1 se debe definir y crear un baseline técnico neutral. El baseline establece plataforma, estructura mínima, validaciones y despliegue de previews; no implementa la solución funcional o visual que la misión pedirá a los participantes.

## Identidad y datos personales

- Los participantes se representan mediante identificadores seudónimos estables.
- GitHub no almacena números telefónicos.
- No se versionan secretos de Hermes, Jev, LLM, GitHub, PostHog ni observabilidad.

## Decisiones abiertas

- Stack definitivo del cliente multiplataforma y contenido exacto del baseline neutral.
- Votación pública o mecanismo auxiliar para ocultarla dentro del requisito de grupo único.
- Stack definitivo del backend comunitario ahora que no necesita PostgreSQL ni una interfaz web principal.
- Proveedor de observabilidad de errores.
- Proveedor y modelo del LLM ligero.
- Forma exacta de ejecutar y desplegar previews A/B/C.
