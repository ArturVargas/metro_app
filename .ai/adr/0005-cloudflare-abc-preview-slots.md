# ADR-0005: Hosting de Base y previews A/B/C en Cloudflare

- **Estado:** aceptada
- **Fecha:** 2026-09-28
- **Contexto:** cada misión necesita un enlace al estado base y cada viernes el grupo recibe tres enlaces jugables; hace falta hospedarlos con URLs estables sin que el tráfico o una segunda votación conviertan automáticamente una variante en baseline del producto.

## Decisión

El estado Base y las previews A/B/C se hospedarán en cuatro proyectos independientes de Cloudflare Pages. Base, A, B y C son ranuras permanentes durante el experimento, con URLs estables.

Base muestra el estado común que reciben los participantes antes de escribir sus prompts. Solo cambia después de la aprobación del responsable de producto. Cada brief público enlaza esta versión.

En cada misión, los tres prompts elegidos por la comunidad se asignan aleatoriamente a A, B y C. Cada ranura se redespliega desde el mismo commit baseline bajo condiciones equivalentes y sobrescribe el build de la misión anterior en esa ranura.

La trazabilidad vincula cada letra con autor, texto exacto del prompt, issue, rama, pull request y preview.

No hay promoción automática al baseline del producto por tráfico ni por una segunda votación de popularidad. Promover una variante como baseline de la siguiente misión requiere decisión del responsable de producto con una checklist breve: jugable, no rompe las reglas y feedback cualitativo del viernes. Telemetría ligera opcional puede informar, no decidir.

Esto alinea el mensaje al grupo: un enlace base al publicar la misión y tres enlaces el viernes; ninguno se vuelve definitivo automáticamente.

## Alternativas consideradas

- Preview efímera por pull request sin ranuras fijas: rechazada porque el grupo necesita URLs estables y comparables cada viernes.
- Usar una sola aplicación con rutas para Base/A/B/C: rechazado para el piloto porque aumenta el riesgo de sobrescribir la ranura equivocada.
- Promoción automática por tráfico o segunda votación: rechazada; la decisión de baseline pertenece al responsable de producto.
- Hosting en el VPS o solo en GitHub Pages sin ranuras permanentes: rechazado a favor de cuatro proyectos Cloudflare con URLs estables.

## Consecuencias

- Hay cuatro proyectos Pages configurados: `metro-app-base`, `metro-app-a`, `metro-app-b` y `metro-app-c`.
- La URL Base es `https://metro-app-base.pages.dev/`; las demás siguen el mismo patrón por letra.
- El pipeline de despliegue debe sobrescribir A/B/C desde el mismo baseline y conservar el mapeo de trazabilidad.
- El mensaje del viernes presenta tres enlaces sin sugerir un ganador automático.
- El despliegue es manual y supervisado mediante Wrangler o GitHub Actions; los secretos no se versionan.

## Reabrir si

- Cloudflare Pages (o equivalente) no permite tres ranuras estables con sobrescritura fiable.
- La trazabilidad entre letra, prompt y artefacto de GitHub no puede mantenerse.
- El ritmo del viernes exige un flujo de promoción distinto al de la checklist del responsable.
