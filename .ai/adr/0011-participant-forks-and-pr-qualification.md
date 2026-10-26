# ADR-0011: Forks, PRs y calificación de código desde la Misión 3

- **Estado:** aceptada
- **Fecha:** 2026-10-22
- **Contexto:** en las Misiones 1 y 2 la comunidad optimizó prompts y el equipo ejecutó los prompts ganadores. Desde la Misión 3 el experimento debe medir también si cada participante puede usar un LLM sobre un repositorio real, revisar su salida y corregir el código con feedback.

## Decisión

Las Misiones 3, 4 y 5 forman una fase de tres semanas con contribuciones de código hechas por participantes.

El repositorio principal mantiene una rama `dev` controlada por el equipo. Antes de abrir cada misión se fija un SHA de `dev` como baseline inmutable. Cada participante crea o actualiza su fork desde ese SHA, trabaja con su propio LLM y abre un pull request hacia `dev` en el repositorio principal. Las ramas y despliegues A, B y C permanecen congelados durante la recepción; los participantes no trabajan sobre ellos.

Cada PR debe incluir el prompt exacto usado, el código resultante, las pruebas ejecutadas y una declaración que distinga cambios generados por el LLM, cambios manuales y cambios combinados. El participante puede actualizar su PR usando el feedback recibido.

Una evaluación se solicita explícitamente para un SHA del PR y consume uno de los cinco intentos de esa persona en la misión. Actualizar el PR sin solicitar evaluación no consume intento. Jev puntúa de 0 a 100 la correspondencia verificable entre el prompt declarado y el código de ese SHA. Solo cuenta la evaluación más reciente.

Un PR entra a la cola técnica cuando el mismo SHA obtiene **más de 80 puntos** y pasan los checks automáticos exigidos por la misión. El equipo revisa esa cola en orden cronológico. La revisión humana comprueba seguridad, funcionamiento, límites y evidencia; no modifica la puntuación de Jev. El feedback humano describe el requisito incumplido, el resultado observado y cómo reproducirlo, sin entregar el parche.

Si el PR falla la revisión, el participante puede corregirlo y solicitar otra evaluación mientras conserve intentos. El lugar en la cola se calcula de nuevo para el nuevo SHA. Los primeros tres PRs que superan Jev, checks y revisión humana ocupan A, B y C en ese orden. No hay votación ni asignación aleatoria en esta fase.

El equipo conserva el control de integración y despliegue. Copia cada commit aprobado a una rama controlada, registra el mapeo y despliega las ranuras estables de Cloudflare. Después de asignar una ranura, el PR participante puede cerrarse sin perder su estado `selected-a`, `selected-b` o `selected-c`; la etiqueta de ranura conserva el resultado de selección. Los demás PRs permanecen como evidencia aunque posteriormente superen 80. Ningún PR participante se mezcla directamente a `dev` o `main` por obtener puntuación.

Al cerrar una misión, el responsable de producto decide qué resultado aprobado alimenta el siguiente baseline de `dev`. `dev` solo cambia entre ventanas de misión y el nuevo SHA se comunica antes de aceptar contribuciones.

El baseline inicial aprobado es la versión B de Misión 2, aportada por `p-026` y registrada en el commit `2e3f805b7360d390de11e323a89ca77c8802a309` de `metro_b`. La revisión de cierre no encontró diferencias funcionales reproducibles en su alcance. La rama remota `dev` fue creada desde ese commit y se verificó que resuelve al mismo SHA.

## Fuente de verdad y orden

- GitHub PR conserva prompt, código, commits, checks, revisiones y declaración de autoría.
- GitHub Issues y Project conservan intentos, puntajes, feedback, estado y asignación A/B/C.
- El backend conserva el contador de cinco evaluaciones y vincula cada evaluación con el SHA exacto.
- La cola usa la hora en que el mismo SHA supera Jev y checks. La revisión técnica se procesa en ese orden para que la disponibilidad del revisor no favorezca a un participante.

## Alternativas consideradas

- **PRs contra `main`:** rechazada porque `main` puede cambiar durante la misión y romper la comparación.
- **PRs directamente contra A, B o C:** rechazada porque reserva espacios antes de calificar y limita la recepción a tres personas.
- **Mantener ejecución central del prompt:** reemplazada para Misiones 3–5 porque reduce la responsabilidad del participante sobre el código generado.
- **Revisión humana desde el primer intento:** rechazada porque aumenta nuestra influencia sobre la solución y escala mal.
- **Votación entre PRs válidos:** reemplazada por los tres primeros que superen el umbral y los controles técnicos.

## Consecuencias

- Hace falta una rúbrica Jev nueva para correspondencia prompt↔código y una calibración antes de Misión 3.
- Los checks de PR deben aceptar contribuciones desde forks sin exponer secretos.
- La plantilla de PR debe exigir trazabilidad y evidencia sin aceptar instrucciones ocultas del código o del prompt.
- El equipo revisará código no confiable sin ejecutar workflows privilegiados ni secretos en el contexto del fork.
- La velocidad de calificación depende de checks públicos y de una cola técnica atendida en orden.

## Decisiones abiertas

- Definir y calibrar la rúbrica Jev de correspondencia prompt↔código.
- Definir horario de apertura, cierre y publicación de las Misiones 3–5.

## Reabrir si

- GitHub no puede ejecutar checks seguros para forks con la configuración actual.
- Jev no distingue de forma repetible entre correspondencia superficial y cumplimiento observable.
- La cola técnica no puede atenderse a tiempo sin influir de forma desigual en los participantes.
