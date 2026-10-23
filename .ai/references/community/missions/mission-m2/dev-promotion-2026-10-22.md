# Promoción de Misión 2 al primer baseline de `dev`

## Decisión

El responsable de producto aprobó la versión B de Misión 2 como origen de la fase de contribuciones mediante forks y PRs.

| Campo | Valor |
| --- | --- |
| Variante | B |
| Participante | `p-026` |
| Rama de origen | `metro_b` |
| PR de ejecución | [#40](https://github.com/ArturVargas/metro_app/pull/40) |
| Commit de origen | `2e3f805b7360d390de11e323a89ca77c8802a309` |
| Rama creada | `dev` |
| Fecha | 2026-10-22 |

## Razón

La revisión de cierre de Misión 2 no encontró diferencias funcionales reproducibles en B dentro del alcance probado. Las tres variantes conservaron el estado en el cliente y no presentaron bloqueos de seguridad.

## Verificación

- La documentación del flujo M3–M5 fue integrada en `main` mediante el PR [#43](https://github.com/ArturVargas/metro_app/pull/43).
- `origin/metro_b` resolvió al commit aprobado.
- La rama remota `dev` fue creada directamente desde ese commit.
- `origin/dev` resolvió a `2e3f805b7360d390de11e323a89ca77c8802a309` después de la creación.

## Uso

Este commit es el origen de `dev`. Antes de abrir Misión 3, el contrato interno debe registrar el SHA de apertura vigente; si `dev` recibe preparación autorizada entre misiones, ese nuevo SHA reemplaza al origen como baseline operativo de la misión.
