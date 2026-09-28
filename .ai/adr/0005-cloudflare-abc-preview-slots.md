# ADR-0005: Hosting de previews A/B/C en Cloudflare

- **Estado:** aceptada
- **Fecha:** 2026-09-28
- **Contexto:** cada viernes el grupo recibe tres enlaces jugables; hace falta hospedarlos con URLs estables sin que el tráfico o una segunda votación conviertan automáticamente una variante en baseline del producto.

## Decisión

Las previews A/B/C de cada viernes se hospedarán en Cloudflare (Pages o equivalente). A, B y C son ranuras permanentes durante el experimento, con URLs estables (subdominios o rutas `a`/`b`/`c`).

En cada misión, los tres prompts elegidos por la comunidad se asignan aleatoriamente a A, B y C. Cada ranura se redespliega desde el mismo commit baseline bajo condiciones equivalentes y sobrescribe el build de la misión anterior en esa ranura.

La trazabilidad vincula cada letra con autor, texto exacto del prompt, issue, rama, pull request y preview.

No hay promoción automática al baseline del producto por tráfico ni por una segunda votación de popularidad. Promover una variante como baseline de la siguiente misión requiere decisión del responsable de producto con una checklist breve: jugable, no rompe las reglas y feedback cualitativo del viernes. Telemetría ligera opcional puede informar, no decidir.

Esto alinea el mensaje al grupo: tres enlaces el viernes; ninguno se vuelve definitivo automáticamente.

## Alternativas consideradas

- Preview efímera por pull request sin ranuras fijas: rechazada porque el grupo necesita URLs estables y comparables cada viernes.
- Promoción automática por tráfico o segunda votación: rechazada; la decisión de baseline pertenece al responsable de producto.
- Hosting en el VPS o solo en GitHub Pages sin ranuras permanentes: rechazado a favor de Cloudflare para desplegar y sobrescribir tres ranuras con URLs estables.

## Consecuencias

- Hay que configurar tres ranuras Cloudflare con URLs estables antes de la primera publicación del viernes.
- El pipeline de despliegue debe sobrescribir A/B/C desde el mismo baseline y conservar el mapeo de trazabilidad.
- El mensaje del viernes presenta tres enlaces sin sugerir un ganador automático.
- Cloudflare aún no está configurado; este ADR solo acepta el modelo de hosting y promoción.

## Reabrir si

- Cloudflare Pages (o equivalente) no permite tres ranuras estables con sobrescritura fiable.
- La trazabilidad entre letra, prompt y artefacto de GitHub no puede mantenerse.
- El ritmo del viernes exige un flujo de promoción distinto al de la checklist del responsable.
