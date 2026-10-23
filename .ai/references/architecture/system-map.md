# Mapa del sistema

## Posicionamiento

Metro App contiene dos productos operativamente independientes dentro del mismo repositorio:

1. Un juego web y móvil cuya simulación ocurre en el dispositivo.
2. Un sistema comunitario que evalúa prompts y entregas de código, coordina la selección y publica tres variantes del producto.

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
- GitHub Issues como historial autoritativo de misiones, prompts, intentos y feedback.
- Project privado `Metro App — Community Experiment` como proyección operativa del último intento, la votación histórica o la cola técnica según modalidad, la asignación A/B/C y los enlaces de ejecución; se reconstruye desde Issues si una sincronización falla.
- GitHub como origen de issues, forks, ramas y pull requests. Desde M3, `dev` es la rama base de contribución y los participantes abren PRs desde sus forks.
- Cuatro proyectos de Cloudflare Pages hospedan ranuras permanentes Base/A/B/C con URLs estables; cada misión parte de Base y sobrescribe A/B/C con los resultados elegidos.
- La promoción de una variante al baseline de la siguiente misión es decisión del responsable de producto, no automática por tráfico ni por segunda votación.

## Límites

- Hermes transmite identidad seudónima, mensaje y contexto de misión; no calcula puntajes.
- El backend valida intentos, ejecuta la evaluación, calcula la puntuación y persiste el resultado.
- Jev devuelve decisiones estructuradas; no redacta feedback.
- El LLM recibe los hallazgos ya calculados y no puede alterar el resultado.
- GitHub conserva prompts, intentos, feedback, estados, selección y mapeo de variantes.
- La sincronización al Project ocurre después de confirmar el comentario del intento y nunca invalida un intento si falla.
- En M1–M2, el agente de código trabaja sobre ramas aisladas creadas desde el mismo commit.
- En M3–M5, cada participante supervisa su LLM en un fork creado desde el SHA inmutable de `dev`; Jev puntúa prompt↔código y el equipo revisa los PRs que superan el umbral.
- A/B/C son destinos controlados por el equipo. Los participantes no escriben ni despliegan esas ramas o ranuras.

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

## Fase de contribuciones M3–M5

El flujo aprobado es `brief → fork → PR a dev → Jev (>80) → checks → revisión humana → A/B/C → despliegue supervisado`. El contador sigue limitado a cinco evaluaciones por participante y misión. GitHub conserva el SHA evaluado, prompt, código, evidencia, feedback y origen de las correcciones.

El primer `dev` partirá de la versión B de Misión 2: `p-026`, commit `2e3f805b7360d390de11e323a89ca77c8802a309`. La rama se crea después de integrar la documentación de esta fase en `main`.

## Decisiones abiertas

- Votación pública o mecanismo auxiliar para ocultarla dentro del requisito de grupo único.
- Stack definitivo del backend comunitario ahora que no necesita PostgreSQL ni una interfaz web principal.
- Proveedor de observabilidad de errores.
- Proveedor y modelo del LLM ligero.
- Rúbrica y calibración Jev de correspondencia prompt↔código.
