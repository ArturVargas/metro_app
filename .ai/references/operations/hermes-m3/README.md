# Hermes para Misión 3

Cambios para que Fortgate evalúe PRs en lugar de prompts. Aplicados en el VPS el 2026-10-26 a las 11:46 America/Mexico_City, con el checkout en `e4e1b2d`. `METRO_ACTIVE_MISSION` sigue sin definir (Misión 2) y `RECORD_ATTEMPTS=0` hasta la apertura.

## Archivos

- `metro-eval.m3.patch`: sobre `~/bin/metro-eval`. Lee `METRO_ACTIVE_MISSION`, toma el brief de la misión activa y, en `mission-m3`, extrae el número del PR del mensaje y ejecuta `evaluate:pr`. Si existe `~/.hermes/state/metro-eval.paused`, sale con 3 e imprime el aviso de pausa (ver abajo). Sale con 2 si el PR se rechaza antes de gastar intento, con 8 si el mensaje no trae enlace de PR y con 9 si GitHub no devolvió el contexto completo del diff ("contexto incompleto"; reintenta una vez y no gasta intento).
- `SKILL.m3.patch`: sobre el skill de Hermes (v0.5.0). Fortgate nunca abre ni revisa el PR; responde "califica" o "no califica" y menciona el commit evaluado. Con código 3 responde exactamente el texto que imprimió `metro-eval` (ventana cerrada o pausa).

Los dos parches parten de los archivos previos a Misión 3 e incluyen la bandera de pausa y el cambio de zona horaria (decisión D7 del [contrato](../../community/missions/mission-m3/internal-contract.md#decisiones-registradas)): la ventana pasa de `America/Bogota` (hora Colombia) a `America/Mexico_City` (hora CDMX).

## Zona horaria CDMX

Desde Misión 3, la ventana de evaluación es de martes a domingo, 06:00–23:55 hora CDMX (`America/Mexico_City`), lunes cerrado. En el VPS el cambio de zona se aplica la noche del 29 de octubre y toca:

- `~/bin/metro-eval`: `TZ` del cálculo de la ventana y el texto de ventana cerrada.
- `~/bin/metro-window-notice`: `TZ`, "hora CDMX" y "el enlace de tu PR" en lugar de "tu prompt".
- `~/.config/systemd/user/metro-window-open.timer` y `metro-window-close.timer`: `OnCalendar` en `America/Mexico_City`.
- El skill `metro-prompt-eval` y las líneas de la ventana en `~/.hermes/SOUL.md` (el SOUL no se versiona en el repo).

Los parches de ese cambio sobre los archivos en vivo se guardan en privado en el VPS, en `~/m3-calib/private/rollout/tz-cdmx/` (`<archivo>.tz-cdmx.patch`).

## Pausa entre misiones

Misión 2 cerró antes de que abra Misión 3. Desde el 2026-10-27 a las 07:14 hora CDMX las evaluaciones y los avisos de ventana están en pausa hasta la apertura del viernes 30 de octubre a las 06:00 hora CDMX (aprobado por Artur).

- **Bandera:** mientras exista `~/.hermes/state/metro-eval.paused`, `metro-eval` sale con 3 en todos sus modos (normal, `--previous` y `--share`), sin evaluar ni registrar intentos. Imprime la primera línea del archivo o, si está vacío, el aviso por defecto: "La Misión 2 ya cerró. La Misión 3 abre el viernes 30 de octubre a las 6:00 am (hora CDMX); ese día podrás enviar el enlace de tu PR." El skill responde ese texto tal cual. No hace falta reiniciar el gateway para activar ni quitar la pausa.
- **Pausar:** `: > ~/.hermes/state/metro-eval.paused` (o escribir en la primera línea otro aviso) y `systemctl --user stop metro-window-open.timer metro-window-close.timer`.
- **Reanudar:** `rm ~/.hermes/state/metro-eval.paused` y arrancar los timers con `systemctl --user start`.
- Los timers solo se detienen; siguen habilitados, así que un reinicio del VPS los vuelve a arrancar. Tienen `Persistent=false`: al arrancarlos no disparan los avisos perdidos.

## Activación de Misión 3

**Jueves 29 de octubre, 23:30 hora CDMX** (la pausa sigue):

1. Respaldar con sufijo `.bak.<fecha>-pre-cdmx` los seis archivos de la lista de zona horaria.
2. Aplicar los seis `*.tz-cdmx.patch` con `patch`; comprobar `bash -n ~/bin/metro-eval ~/bin/metro-window-notice`.
3. `systemctl --user daemon-reload` y `systemctl --user start metro-window-open.timer`; su siguiente disparo es el viernes a las 06:00 hora CDMX. **No** arrancar todavía `metro-window-close.timer`: a las 23:30 dispararía a las 23:45 de ese mismo jueves.
4. Reiniciar `hermes-gateway.service` (no `hermes-gateway-inventario`) y confirmar `is-active`.
5. No borrar la bandera de pausa.

**Viernes 30 de octubre, 06:00 hora CDMX:**

1. `rm ~/.hermes/state/metro-eval.paused`.
2. En `.env.local`: `METRO_ACTIVE_MISSION=mission-m3` y `RECORD_ATTEMPTS=1` (`M3_DEV_SHA` ya está fijado).
3. `systemctl --user start metro-window-close.timer`.
4. Reiniciar `hermes-gateway.service` y confirmar `is-active`.
5. Verificar sin registrar: `metro-eval` ya no imprime el aviso de pausa, `evaluate:pr --pr 47 --participant p-000 --mission mission-m3 --mock` responde, y `systemctl --user list-timers 'metro-window-*'` muestra los dos disparos en hora CDMX.
6. Pasar el Issue #50 a `Active` en el Project y enviar los dos mensajes aprobados.

## Rollback

- **Zona horaria:** restaurar los `.bak.<fecha>-pre-cdmx`, `systemctl --user daemon-reload`, reiniciar los timers y `hermes-gateway.service`.
- **Activación:** volver a `RECORD_ATTEMPTS=0`, quitar `METRO_ACTIVE_MISSION`, crear la bandera de pausa y reiniciar `hermes-gateway.service`.
- **Misión 3 completa:** restaurar los `.bak.<fecha>-pre-m3` de `~/bin/metro-eval`, del skill y de `.env.local`, y reiniciar `hermes-gateway.service`.

## Variables nuevas en `.env.local`

| Variable | Valor |
| --- | --- |
| `METRO_ACTIVE_MISSION` | `mission-m3` |
| `M3_DEV_SHA` | `1c60eea3b88962768dae0501e2cc9b8f20041b29` (`dev` publicado para la misión) |
| `JEV_TIMEOUT_MS` | opcional: los diffs grandes tardan más que un prompt |

## Antes de aplicar

1. Tener los workflows de PR en `main` y en `dev` (ver `../participant-pr-workflows/README.md`).
2. `bash -n ~/bin/metro-eval` y una prueba con `--mock` sobre un PR de ensayo, sin `--record`.
