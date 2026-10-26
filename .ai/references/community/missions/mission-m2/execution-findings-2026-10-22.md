# Findings de ejecución — Misión 2 — 2026-10-22

## Alcance

Revisión de fidelidad, funcionamiento y seguridad de las variantes desplegadas al cierre de la Misión 2.

| Variante | Participante | PR | Commit desplegado | URL |
| --- | --- | --- | --- | --- |
| A | `p-898` | [#39](https://github.com/ArturVargas/metro_app/pull/39) | `d6d06edd699e9b0a07d1f44f426389b67e9d1b1d` | <https://metro-app-a.pages.dev/> |
| B | `p-026` | [#40](https://github.com/ArturVargas/metro_app/pull/40) | `2e3f805b7360d390de11e323a89ca77c8802a309` | <https://metro-app-b.pages.dev/> |
| C | `p-549` | [#41](https://github.com/ArturVargas/metro_app/pull/41) | `e1d59c14d935f130497bde38734adb3d7813c1b1` | <https://metro-app-c.pages.dev/> |

Los findings describen diferencias entre el prompt elegido y su ejecución. No cambian el puntaje ni la elegibilidad del prompt y no crean intentos nuevos.

## Variante A — PR #39

### M2-A-001

- **Tipo / severidad:** `execution-gap` / `high`
- **Requisito:** al soltar un tren donde coinciden varias líneas, considerar solo líneas sin tren, elegir la más cercana y engrosar únicamente la elegida. En un empate exacto, usar el orden azul, verde azulado y rosa púrpura.
- **Observado:** la implementación considera todas las líneas dentro de la zona y las ordena por antigüedad. Durante el arrastre puede engrosar más de una. Si la primera está ocupada, rechaza el tren aunque otra línea válida comparta el punto.
- **Evidencia:** en el despliegue A se creó una línea azul y otra verde que comparten la Estación 2. El tren 1 se asignó a la azul. Al soltar el tren 2 en el mismo punto apareció `Esa línea ya tiene tren` y la verde permaneció libre.
- **Impacto:** fallan los casos explícitos de estación compartida, cercanía y selección de una línea libre.
- **Estado:** `open`.

### M2-A-002

- **Tipo / severidad:** `prompt-fidelity` / `medium`
- **Requisito:** orientar la pastilla gradualmente, con máximo de `720°/s`; el giro de 180 grados debe durar cerca de 0.25 segundos.
- **Observado:** el ángulo se obtiene directamente del tramo y cambia de inmediato al cambiar la dirección. No existe estado ni interpolación para la rotación.
- **Impacto:** el giro visual en extremos y cambios de tramo no cumple el comportamiento observable definido en el quinto intento del prompt.
- **Estado:** `open`.

## Variante B — PR #40

No se encontraron diferencias funcionales reproducibles en el alcance revisado. La implementación conserva la asignación automática, la ejecución y pausa global, las paradas de dos segundos, la edición con la simulación detenida, el retiro y la reasignación, el borrado y el reset descritos por el prompt.

## Variante C — PR #41

### M2-C-001

- **Tipo / severidad:** `execution-gap` / `medium`
- **Requisito:** tocar el tren lo retira y conserva su línea.
- **Observado:** cuando el tren está encima o cerca de una estación, el hit target de la estación queda sobre el hit target del tren. El toque selecciona la estación en lugar de retirar el tren.
- **Evidencia:** después de asignar T1 a una línea que inicia en la Estación 1, `elementFromPoint` en el centro del tren devolvió el elemento `Estación 1, círculo`. El botón `Retirar tren` del panel sí permanece disponible.
- **Impacto:** la interacción directa con el tren falla durante la parada de dos segundos y mientras se encuentra dentro del área táctil de una estación; existe la alternativa del panel.
- **Estado:** `open`.

## Seguridad

No se encontraron `security-blocker`. Las tres variantes mantienen el estado en el cliente y no agregan entrada de texto, backend, persistencia, llamadas de red, HTML dinámico ni ejecución dinámica de código.

## Verificación común

- Ramas revisadas: `origin/metro_a`, `origin/metro_b` y `origin/metro_c` después de los merges de #39, #40 y #41.
- Lint y typecheck exitosos en las tres variantes.
- Export web de Expo exitoso en las tres variantes.
- Se abrieron las tres URLs de Cloudflare y se verificaron sus encabezados A/p-898, B/p-026 y C/p-549.
- No aparecieron errores ni advertencias en la consola durante los smoke tests.
- No se repitió la validación en un teléfono físico ni en Expo nativo.

## Uso como feedback

Comparte con cada participante solo los findings de su variante. Describe el resultado observado y la prueba que lo reproduce; no recalifiques el prompt ni conviertas el finding en una solución completa.
