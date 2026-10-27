# Hermes para Misión 3

Cambios para que Fortgate evalúe PRs en lugar de prompts. Aplicados en el VPS el 2026-10-26 a las 11:46 America/Mexico_City, con el checkout en `e4e1b2d`. `METRO_ACTIVE_MISSION` sigue sin definir (Misión 2) y `RECORD_ATTEMPTS=0` hasta la apertura.

## Archivos

- `metro-eval.m3.patch`: sobre `~/bin/metro-eval`. Lee `METRO_ACTIVE_MISSION`, toma el brief de la misión activa y, en `mission-m3`, extrae el número del PR del mensaje y ejecuta `evaluate:pr`. Sale con 2 si el PR se rechaza antes de gastar intento, con 8 si el mensaje no trae enlace de PR y con 9 si GitHub no devolvió el contexto completo del diff ("contexto incompleto"; reintenta una vez y no gasta intento).
- `SKILL.m3.patch`: sobre el skill de Hermes (v0.5.0). Fortgate nunca abre ni revisa el PR; responde "califica" o "no califica" y menciona el commit evaluado.

Los dos parches parten de los archivos previos a Misión 3 e incluyen el cambio de zona horaria (decisión D7 del [contrato](../../community/missions/mission-m3/internal-contract.md#decisiones-registradas)): la ventana pasa de `America/Bogota` (hora Colombia) a `America/Mexico_City` (hora CDMX).

## Zona horaria CDMX

Desde Misión 3, la ventana de evaluación es de martes a domingo, 06:00–23:55 hora CDMX (`America/Mexico_City`), lunes cerrado. En el VPS ya están aplicados los cambios de Misión 3 con la ventana en hora Colombia; el cambio a hora CDMX se aplica en la activación del 30 de octubre y toca:

- `~/bin/metro-eval`: `TZ` del cálculo de la ventana y el texto de ventana cerrada.
- `~/bin/metro-window-notice`: `TZ`, "hora CDMX" y "el enlace de tu PR" en lugar de "tu prompt".
- `~/.config/systemd/user/metro-window-open.timer` y `metro-window-close.timer`: `OnCalendar` en `America/Mexico_City`.
- El skill `metro-prompt-eval` y las líneas de la ventana en `~/.hermes/SOUL.md`.

Después: `systemctl --user daemon-reload` y reiniciar `hermes-gateway.service`.

## Variables nuevas en `.env.local`

| Variable | Valor |
| --- | --- |
| `METRO_ACTIVE_MISSION` | `mission-m3` |
| `M3_DEV_SHA` | `1c60eea3b88962768dae0501e2cc9b8f20041b29` (`dev` publicado para la misión) |
| `JEV_TIMEOUT_MS` | opcional: los diffs grandes tardan más que un prompt |

## Antes de aplicar

1. Tener los workflows de PR en `main` y en `dev` (ver `../participant-pr-workflows/README.md`).
2. `bash -n ~/bin/metro-eval` y una prueba con `--mock` sobre un PR de ensayo, sin `--record`.
