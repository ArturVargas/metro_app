# ADR-0002: GitHub como fuente de verdad comunitaria

- **Estado:** aceptada
- **Fecha:** 2026-09-28
- **Contexto:** el piloto tiene cerca de 50 participantes y necesita trazabilidad entre prompts, evaluación y cambios de código sin operar una base de datos adicional.

## Decisión

GitHub Issues y GitHub Projects serán la fuente de verdad del experimento. Cada participante tendrá un issue por misión; cada intento y feedback quedará como comentario. Los campos numéricos, de texto y selección guardarán puntaje actual, intentos usados, estado, misión y asignación A/B/C. Las etiquetas representarán estados, no valores de puntaje.

El Project privado `Metro App — Community Experiment`, propiedad de `ArturVargas`, funciona como proyección operativa. Issues conserva el historial autoritativo; el Project muestra el último intento, elegibilidad, resultado final de votación, asignación A/B/C y enlaces de ejecución. Un fallo al sincronizar el Project no invalida el comentario ya confirmado y se repara mediante reconciliación.

El Project activo es el número `1`, disponible en `https://github.com/users/ArturVargas/projects/1`, y está vinculado a `ArturVargas/metro_app`. El Issue operativo de la primera misión es `#14`. Los nombres exactos de campos y vistas se registran en `.ai/references/community/github-project.md` porque forman parte del contrato de integración.

El backend accederá mediante una GitHub App con permisos mínimos. Durante las pruebas locales y el piloto inicial puede usarse temporalmente un fine-grained PAT de la cuenta propietaria, limitado a `metro_app` con `Issues: Read and write`. No habrá PostgreSQL en el MVP.

Para automatizar el Project personal durante el piloto se usa una segunda credencial clásica de `ArturVargas` limitada al scope `project`; no sustituye el token de Issues. La migración a una GitHub App queda ligada a mover el Project a una organización o a que GitHub elimine la limitación de tokens para Projects personales.

## Alternativas consideradas

- PostgreSQL: rechazado para el piloto por duplicar la fuente de verdad y aumentar operación.
- Etiquetas para cada puntaje: rechazado por crear una taxonomía difícil de mantener.
- Linear además de GitHub: aplazado porque el resultado termina en issues, ramas y pull requests de GitHub.

## Consecuencias

- Las evaluaciones deben serializarse y usar identificadores idempotentes.
- La estructura de comentarios y campos se considera un contrato versionado.
- El texto exacto y el historial no se duplican en campos del Project; estos campos son snapshots reconstruibles.
- Los votos individuales y los conteos parciales no se escriben en el Project; el total aparece después del cierre.
- GitHub no debe almacenar teléfonos, tokens ni secretos.
- En un repositorio perteneciente a una cuenta personal, el PAT temporal debe pertenecer a `ArturVargas`; un fine-grained PAT de una cuenta colaboradora no puede sustituirlo.
- El rendimiento y las garantías transaccionales son suficientes solo para el piloto.

## Reabrir si

- El volumen, la concurrencia o los límites de API producen pérdida o duplicación de datos.
- Se necesita consultar relaciones que GitHub no puede representar de forma confiable.
- El experimento requiere datos privados que no deben vivir en el repositorio.
