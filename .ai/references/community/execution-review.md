# Revisión de ejecuciones y feedback

## Cuándo usar este documento

Úsalo después de que un agente produzca una variante A, B o C o cuando un PR participante supere el umbral Jev. La revisión mide fidelidad, funcionamiento y seguridad sin intentar convertir cada resultado en una solución perfecta.

En Misiones 1–2, la revisión no vuelve a calificar el prompt. Desde Misión 3, Jev ya puntúa el par prompt↔código antes de esta revisión; la persona revisora no cambia ese puntaje.

## Fuentes de verdad

- El Issue del participante conserva el prompt, puntaje y feedback de evaluación.
- El pull request conserva el código exacto generado para la variante.
- El comentario de revisión del PR conserva los findings de esa ejecución.
- Un reporte dentro de la misión reúne la evidencia de A/B/C y enlaza los Issues y PRs.
- Desde Misión 3, el PR del fork conserva además el SHA evaluado, checks, pruebas y declaración de cambios `LLM`, `manual` o `combinado`.

Un finding de ejecución no crea un intento nuevo, no consume uno de los cinco intentos y no modifica el puntaje de TypeSafe.

## Clasificación

| Tipo | Significado | Tratamiento |
| --- | --- | --- |
| `prompt-gap` | El prompt omite o vuelve ambiguo un comportamiento necesario. | Se convierte en feedback accionable para mejorar el siguiente prompt. |
| `execution-gap` | El prompt es explícito, pero el código no lo cumple. | Se atribuye a la ejecución; puede sugerir al participante una comprobación más fuerte, sin penalizar el puntaje anterior. |
| `platform-gap` | El resultado cambia por plataforma, viewport, navegador o infraestructura. | Se registra con el entorno y evidencia reproducible. |
| `security-blocker` | La ejecución expone datos, permisos, código o usuarios a un riesgo material. | Detiene publicación hasta corregirse y verificarse. |

## Formato de un finding

```text
ID: <misión>-<variante>-<secuencia>
Tipo: prompt-gap | execution-gap | platform-gap | security-blocker
Severidad: blocker | high | medium | low
Requisito del prompt: <texto o resumen verificable>
Resultado observado: <qué ocurrió>
Evidencia: <pasos, medida, archivo/línea, commit y entorno>
Impacto: <qué parte de la experiencia o comparación afecta>
Estado: open | accepted-for-experiment | fixed | not-reproducible
```

## Flujo

1. Fijar variante o PR, commit evaluado, prompt de origen y entorno de prueba.
2. Ejecutar checks estáticos y las pruebas rápidas descritas en el prompt.
3. Registrar cada diferencia con una sola causa observable.
4. Publicar el mismo resumen en el PR y en el reporte de la misión.
5. Añadir al Issue del participante un comentario de feedback de ejecución. Si la variante es compuesta, enviar a cada participante solo los findings relacionados con sus requisitos.
6. Conservar inicialmente el código generado. Corregir antes de publicar únicamente `security-blocker` o un fallo que impida desplegar o probar la variante.
7. Si producto decide corregir otro finding, conservar la evidencia original y marcarlo `fixed`; no borrar el resultado inicial.

## Cola técnica desde la Misión 3

1. Confirmar que la evaluación más reciente corresponde al HEAD actual del PR y es mayor que 80.
2. Confirmar checks exitosos y que el PR parte del SHA de `dev` publicado.
3. Ordenar candidatos por la hora en que cumplieron ambos requisitos.
4. Revisar seguridad, funcionamiento, límites y evidencia en ese orden.
5. Si falla, publicar findings sin parche. El participante corrige y solicita una evaluación nueva para el nuevo SHA.
6. Si pasa, asignar la siguiente letra disponible y congelar ese commit para el despliegue controlado.

## Feedback al participante

El feedback distingue siempre entre la calidad del prompt y la fidelidad del agente. Incluye:

- puntaje original, sin modificar;
- qué requisito permitió detectar el fallo;
- si el fallo pertenece al prompt, a la ejecución o a la plataforma;
- una comprobación concreta que podría fortalecer el siguiente prompt.

No presenta un `execution-gap` como error del participante ni publica datos personales.

## Skills relacionadas

- `superpowers:verification-before-completion`: recopilar evidencia antes de declarar que una variante funciona.
- `superpowers:systematic-debugging`: aislar la causa de un comportamiento inesperado sin corregirla automáticamente.
- `architecture-workflow`: cambiar la trazabilidad, fuentes de verdad o responsabilidades del flujo.
- `ponytail:ponytail`: evitar infraestructura adicional cuando comentarios y documentos existentes bastan.
