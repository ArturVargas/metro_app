# ADR-0002: GitHub como fuente de verdad comunitaria

- **Estado:** aceptada
- **Fecha:** 2026-09-28
- **Contexto:** el piloto tiene cerca de 50 participantes y necesita trazabilidad entre prompts, evaluación y cambios de código sin operar una base de datos adicional.

## Decisión

GitHub Issues y GitHub Projects serán la fuente de verdad del experimento. Cada participante tendrá un issue por misión; cada intento y feedback quedará como comentario. Los campos numéricos, de texto y selección guardarán puntaje actual, intentos usados, estado, misión y asignación A/B/C. Las etiquetas representarán estados, no valores de puntaje.

El backend accederá mediante una GitHub App con permisos mínimos. Durante las pruebas locales y el piloto inicial puede usarse temporalmente un fine-grained PAT de la cuenta propietaria, limitado a `metro_app` con `Issues: Read and write`. No habrá PostgreSQL en el MVP.

## Alternativas consideradas

- PostgreSQL: rechazado para el piloto por duplicar la fuente de verdad y aumentar operación.
- Etiquetas para cada puntaje: rechazado por crear una taxonomía difícil de mantener.
- Linear además de GitHub: aplazado porque el resultado termina en issues, ramas y pull requests de GitHub.

## Consecuencias

- Las evaluaciones deben serializarse y usar identificadores idempotentes.
- La estructura de comentarios y campos se considera un contrato versionado.
- GitHub no debe almacenar teléfonos, tokens ni secretos.
- En un repositorio perteneciente a una cuenta personal, el PAT temporal debe pertenecer a `ArturVargas`; un fine-grained PAT de una cuenta colaboradora no puede sustituirlo.
- El rendimiento y las garantías transaccionales son suficientes solo para el piloto.

## Reabrir si

- El volumen, la concurrencia o los límites de API producen pérdida o duplicación de datos.
- Se necesita consultar relaciones que GitHub no puede representar de forma confiable.
- El experimento requiere datos privados que no deben vivir en el repositorio.
