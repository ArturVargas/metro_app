# Contrato interno — Misión 2

## 1. Identidad

- **ID de misión:** `mission-m2`
- **Versión:** `1`
- **Estado:** `borrador`
- **Brief público:** `missions/mission-m2/public-brief.md`
- **Responsable:** `ArturVargas`
- **Zona horaria:** `PENDIENTE`
- **Evaluaciones:** `martes y jueves, con horarios pendientes`
- **Votación:** `PENDIENTE`
- **Publicación A/B/C:** `viernes, hora pendiente`

## 2. Evaluación

| Criterio | Qué comprueba | Peso |
| --- | --- | ---: |
| verifiability | El prompt permite comprobar asignación, movimiento, retiro/reasignación y uso con mouse/toque | 30 |
| actionable-acceptance | El agente puede implementar la interacción y el ciclo del tren sin inventar requisitos | 30 |
| specificity | El participante toma decisiones claras sobre controles, representación y estados visibles | 25 |
| scope-limits | Protege el juego actual y excluye sistemas fuera de la misión | 15 |

- **Total:** 100 puntos.
- **Umbral de elegibilidad:** 70 puntos.
- **Máximo:** cinco evaluaciones por participante.
- **Versión elegible:** solo el intento más reciente; si obtiene menos de 70, no participa en la votación.
- **Versión de la rúbrica:** `rubric-m2-v1`.
- **Versión del prompt de feedback LLM:** `feedback-mentor-m1-v2` mientras el prompt compartido siga siendo neutral respecto a la misión.
- **Fallback de feedback:** `feedback-template-m2-v1`.
- **Hard-fails:** ninguno en v1; los requisitos públicos se califican mediante la rúbrica hasta completar calibración.
- **Calibración TypeSafe:** `PENDIENTE` antes de abrir evaluaciones.

La rúbrica premia que el participante complete las decisiones abiertas del brief. No exige gestos, colores, componentes, estructura de datos ni una solución técnica específica.

## 3. Código base

- **Repositorio:** `ArturVargas/metro_app`
- **Commit base inmutable:** `348f02411096c9837ca98459ed77b8b06119c6a3`
- **Preview base:** `https://metro-app-base.pages.dev/`
- **Área permitida:** `apps/game/` y pruebas relacionadas.
- **Áreas protegidas:** `apps/community/`, `packages/evaluation/`, `.github/workflows/` y documentación del experimento.
- **Dependencias:** reutilizar Expo, React Native Web y `react-native-svg`; una dependencia nueva requiere justificación explícita del prompt y revisión técnica.
- **Instalación:** `pnpm install --frozen-lockfile` con Node `22.21.1`.
- **Validación:** `pnpm lint`, `pnpm typecheck`, `pnpm build:web` y prueba manual común.

## 4. Ejecución A/B/C

- Las tres variantes parten del commit base y se ejecutan en ramas independientes `mission-m2-a`, `mission-m2-b` y `mission-m2-c`.
- Agente, modelo, razonamiento, permisos, presupuesto y tiempo máximo: `PENDIENTE`, pero deben ser idénticos.
- Cada agente recibe solo el brief, el prompt seleccionado, el código base y los comandos de validación; no ve las otras variantes.
- Un fallo se documenta siguiendo [`../../execution-review.md`](../../execution-review.md); no se corrige automáticamente ni modifica el puntaje del prompt.
- Los findings de Misión 1 no forman parte de la evaluación ni de la aceptación de Misión 2.

### Prueba manual común

1. Crear una línea abierta, asignarle un tren y observar ida y vuelta.
2. Crear o cerrar un circuito y observar movimiento continuo en una dirección.
3. Retirar y reasignar un tren sin recargar; confirmar máximo uno por línea.
4. Eliminar y modificar una línea con tren y comprobar las reglas del brief.
5. Repetir la interacción principal con mouse y toque; recargar y comprobar el reinicio.

## 5. GitHub y publicación

- **Issue principal / Project:** `PENDIENTE`; usar el Project comunitario existente.
- Cada intento conserva misión, participante seudónimo, número, prompt exacto, puntaje, elegibilidad, rúbrica y feedback.
- A/B/C conserva autor, prompt, intento, issue, rama, pull request, commit y preview.
- **Previews:** `https://metro-app-a.pages.dev/`, `https://metro-app-b.pages.dev/`, `https://metro-app-c.pages.dev/`.
- La variante elegida y aprobada técnicamente se promueve a `main` y pasa a ser la Base de Misión 3.
- **Rollback:** volver a desplegar el último commit aprobado de `main` en Base.
- **Mensaje del viernes y evidencia de pruebas:** `PENDIENTE`.

## Pendientes antes de publicar

- Definir fechas, horarios y zona horaria.
- Crear el issue principal de Misión 2 en el Project.
- Calibrar `rubric-m2-v1` con prompts débil, medio y fuerte.
- Fijar las condiciones idénticas de ejecución A/B/C.
