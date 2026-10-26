# Hermes para Misión 3 (pendiente de aplicar)

Cambios propuestos para que Fortgate evalúe PRs en lugar de prompts. No están aplicados en el VPS.

## Archivos

- `metro-eval.m3.patch`: sobre `~/bin/metro-eval`. Lee `METRO_ACTIVE_MISSION`, toma el brief de la misión activa y, en `mission-m3`, extrae el número del PR del mensaje y ejecuta `evaluate:pr`. Sale con 2 si el PR se rechaza antes de gastar intento y con 8 si el mensaje no trae enlace de PR.
- `SKILL.m3.patch`: sobre el skill de Hermes (v0.5.0). Fortgate nunca abre ni revisa el PR; responde "califica" o "no califica" y menciona el commit evaluado.

## Variables nuevas en `.env.local`

| Variable | Valor |
| --- | --- |
| `METRO_ACTIVE_MISSION` | `mission-m3` |
| `M3_DEV_SHA` | `1c60eea3b88962768dae0501e2cc9b8f20041b29` (`dev` publicado para la misión) |
| `JEV_TIMEOUT_MS` | opcional: los diffs grandes tardan más que un prompt |

## Antes de aplicar

1. Reemplazar el stub `missions/mission-m3/public-brief.md` por el brief real.
2. Tener los workflows de PR en `main` y en `dev` (ver `../participant-pr-workflows/README.md`).
3. `bash -n ~/bin/metro-eval` y una prueba con `--mock` sobre un PR de ensayo, sin `--record`.
