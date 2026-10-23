# Contribuciones de código desde la Misión 3

## Cómo usar este documento

Usa esta referencia al preparar las Misiones 3, 4 y 5, responder dudas de participantes, configurar el Project o revisar un PR. Complementa las reglas generales de [`experiment-rules.md`](experiment-rules.md), la decisión de arquitectura [ADR-0011](../../adr/0011-participant-forks-and-pr-qualification.md) y el [diseño detallado del flujo](../../../docs/superpowers/specs/2026-10-22-mission-3-participant-pr-design.md).

No uses este flujo para reinterpretar las Misiones 1 y 2; sus prompts, votaciones y variantes permanecen como evidencia histórica.

## Objetivo de aprendizaje

El participante deja de entregar solo un prompt. Debe usar un LLM sobre el repositorio, revisar la salida, comprobarla y corregirla. El experimento observa si puede relacionar una instrucción con el código que produjo y detectar cuándo el resultado no cumple.

## Flujo del participante

1. Recibe el brief, la URL Base, el repositorio y el SHA inmutable de `dev`.
2. Actualiza su fork desde ese SHA y crea una rama para la misión.
3. Analiza el código con su LLM y redacta el prompt de implementación.
4. Revisa el diff, ejecuta los checks y prueba el juego.
5. Abre un PR desde su fork hacia `dev`.
6. En el PR registra prompt, evidencia de pruebas y origen de los cambios.
7. Solicita evaluación para el SHA actual; cada solicitud consume un intento.
8. Usa el feedback de Jev y, cuando corresponda, los findings técnicos para corregir el código.

## Contenido obligatorio del PR

- Participante seudónimo y misión.
- Prompt exacto usado para producir la revisión actual.
- SHA que se solicita evaluar.
- Descripción del comportamiento implementado.
- Checks y pruebas manuales ejecutadas, con resultado.
- Limitaciones conocidas.
- Declaración por cambio: `LLM`, `manual` o `combinado`, con una explicación breve cuando fue corregido después del feedback.

No se incluyen números telefónicos, secretos, credenciales, archivos `.env`, conversaciones privadas completas ni datos ajenos al experimento.

## Evaluación y selección

- Máximo cinco evaluaciones por participante y misión.
- Una evaluación siempre pertenece a un SHA específico.
- Solo cuenta la evaluación más reciente.
- Jev puntúa la correspondencia entre el prompt declarado y el código del SHA.
- El PR necesita más de 80 puntos y checks exitosos para entrar a revisión humana.
- La revisión humana valida seguridad, funcionamiento, alcance y evidencia; no cambia la puntuación.
- Los primeros tres PRs que pasan todos los controles ocupan A, B y C por orden.
- Actualizar el código después de una evaluación invalida esa calificación para la nueva revisión hasta solicitar otra evaluación.

## Feedback humano

Un finding incluye requisito, resultado observado, reproducción, impacto y severidad. No incluye un parche ni instrucciones exactas para implementarlo. El participante decide cómo corregirlo con su LLM o manualmente y registra esa decisión en el PR.

## Responsabilidades del equipo

- Fijar y publicar el SHA de `dev` antes de abrir la misión.
- Mantener congeladas A/B/C mientras se reciben PRs.
- Ejecutar la cola técnica en orden de calificación.
- No ejecutar código no revisado con secretos o permisos de escritura.
- Copiar los commits aprobados a ramas controladas y desplegar las ranuras.
- Registrar mapeo, findings, resultados y promoción del siguiente baseline.

## Baseline inicial aprobado

La rama `dev` fue creada desde la versión B de Misión 2, participante `p-026`, commit `2e3f805b7360d390de11e323a89ca77c8802a309`. La revisión de cierre no encontró diferencias funcionales reproducibles en el alcance probado y la referencia remota se verificó contra el mismo SHA.

## Skills relacionadas

- `architecture-workflow`: cambios en ramas, fuentes de verdad o responsabilidades.
- `superpowers:verification-before-completion`: validar un PR antes de aprobarlo o desplegarlo.
- `ponytail:ponytail-review`: revisar corrección, seguridad, pruebas y complejidad del cambio.
- `superpowers:systematic-debugging`: reproducir un finding sin entregar automáticamente la solución.

## Decisiones todavía abiertas

- Rúbrica y calibración Jev para prompt↔código.
- Calendario exacto de las tres semanas.
