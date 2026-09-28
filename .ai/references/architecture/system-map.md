# Mapa del sistema

## Posicionamiento

Metro App contiene dos productos operativamente independientes dentro del mismo repositorio:

1. Un juego web y móvil cuya simulación ocurre en el dispositivo.
2. Un sistema comunitario que evalúa prompts, coordina votación y genera tres variantes del producto.

Una falla del sistema comunitario no debe impedir jugar. Una partida no necesita consultar el backend comunitario.

## Componentes confirmados

### Juego

- Cliente universal con Expo, React Native Web, TypeScript y `react-native-svg`.
- Motor de simulación local y determinista escrito en TypeScript puro, sin dependencias de la interfaz.
- Dataset de demanda preprocesado y versionado.
- PostHog para análisis de sesiones de juego.
- Servicio de observabilidad de errores por definir.

### Comunidad

- Hermes Agent como adaptador del grupo de WhatsApp.
- Backend sin base de datos relacional propia.
- TypeSafe Jev como evaluador tipado (`Noul` / `Choice` / `Score` únicamente; ver [ADR-0006](../../adr/0006-jev-backend-integration.md)).
- `packages/evaluation` posee rúbricas versionadas, preguntas, scoring 0–100 y validación; `apps/community` las consumirá.
- LLM ligero como redactor de feedback.
- GitHub Issues y Projects como fuente de verdad y auditoría.
- GitHub como origen de issues, ramas y pull requests de las variantes A/B/C.
- Cuatro proyectos de Cloudflare Pages hospedan ranuras permanentes Base/A/B/C con URLs estables; cada misión parte de Base y sobrescribe A/B/C con los resultados elegidos.
- La promoción de una variante al baseline de la siguiente misión es decisión del responsable de producto, no automática por tráfico ni por segunda votación.

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
  game/              Expo, React Native Web y componentes universales
  community/         API para Hermes, Jev, LLM y GitHub
packages/
  simulation/        Motor determinista en TypeScript puro
  evaluation/        rúbrica, puntaje, contratos y validación
.ai/                 contexto, decisiones, ADRs e iniciativas
```

## Secuencia de arranque

Antes de redactar la Misión 1 se debe definir y crear un baseline técnico neutral. El baseline establece plataforma, estructura mínima, validaciones y despliegue de previews; no implementa la solución funcional o visual que la misión pedirá a los participantes.

El baseline aprobado contiene un workspace `pnpm`, el cliente Expo, un tablero adaptable con ocho estaciones estáticas, exportación web y validaciones de lint, tipos y build en GitHub Actions. Excluye mecánicas, simulación, telemetría y backend. Su build aprobado se publica en la ranura Base de Cloudflare.

## Identidad y datos personales

- Los participantes se representan mediante identificadores seudónimos estables.
- GitHub no almacena números telefónicos.
- No se versionan secretos de Hermes, Jev, LLM, GitHub, PostHog ni observabilidad.

## Decisiones abiertas

- Votación pública o mecanismo auxiliar para ocultarla dentro del requisito de grupo único.
- Stack definitivo del backend comunitario ahora que no necesita PostgreSQL ni una interfaz web principal.
- Proveedor de observabilidad de errores.
- Proveedor y modelo del LLM ligero.
- Detalle operativo de la ejecución del agente de código que produce los builds A/B/C (Cloudflare ya aceptado como destino de las ranuras).
