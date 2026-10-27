# Calibración TypeSafe — Misión 3 (pasajeros en espera) — resumen — 2026-10-26

- **Veredicto vigente: `ready` con `rubric-m3-v2`.** El caso fuerte califica en 16 de 16 corridas (81.9–85.4, media 83.5, desviación estándar 1.0; 13 antes de la revisión de los PRs y 3 después); débil, medio y la variante con una desviación quedan en 0 por `core-gap`. Margen mínimo sobre 80: 1.9 puntos. Ver [`rubric-m3-v2`](#puntaje-continuo-y-rubric-m3-v2).
- **Veredicto inicial (`rubric-m3-v1`, total redondeado): `not ready`.** El caso fuerte calificó en 1 de 3 corridas (80.0, 80.0, 87.5). Las secciones "Resultados" a "Veredicto" registran esa primera calibración.
- **Rúbrica:** primero `rubric-m3-v1` + `m3-policy`; después `rubric-m3-v2` (igual que `rubric-m3-v1` salvo el descriptor de fidelidad; puntaje continuo y `core-gap` por probabilidad, de la rama `feat/m3-continuous-scoring`). **Modelo:** `jev-1.14.0`. Umbral (> 80) y alcance sin cambios.
- **Persistencia:** desactivada (sin `--record`); no se escribió ningún intento en GitHub.
- **Material:** los fixtures, diffs y salidas completas son privados y viven solo en el VPS del equipo (`~/m3-calib/private/`) hasta el cierre de la misión (decisión D2). Este resumen no incluye código, diffs ni prompts porque revelarían una solución de la misión. Hashes, comandos y versiones para auditar: [Reproducibilidad](#reproducibilidad).

## Casos

Los tres casos son código real sobre `dev` `acd8258` que solo toca `apps/game/` y pasa lint y typecheck; el fuerte además pasa `build:web`.

`dev` se movió después a `1c60eea3b88962768dae0501e2cc9b8f20041b29` (PR #51), que tiene el mismo `apps/game/` (`git diff acd8258 1c60eea -- apps/game` está vacío). La calibración y los hashes de este reporte siguen siendo válidos para la base nueva.

| Caso | Descripción | Expectativa |
| --- | --- | --- |
| Débil | Prompt vago; el código solo dibuja un adorno fijo | `core-gap`, 0 |
| Medio | Prompt con las reglas del brief; el código no respeta pausa, límite ni reproducibilidad | `core-gap`, 0 |
| Fuerte v1 | Código que cumple todas las reglas; prompt en prosa y pruebas en lista | > 80 |
| Fuerte v2 | El mismo código; prompt con requisitos R1–R10 numerados y una prueba P1–P10 por requisito, más lint, typecheck y build | > 80 |

## Resultados

Niveles: cobertura / fidelidad / alcance / evidencia / trazabilidad. "Rúbrica" es el total antes de la política; "Final" es el que recibe el participante. Las horas están en America/Mexico_City (UTC-6).

| Caso | Corrida | Hora | Rúbrica | Final | Niveles | Hard-fails | Califica |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| Débil | 1–3 | 09:27 | 47.5 ×3 | 0 | 2/1/3/1/3 | core-gap | no |
| Medio | 1 | 09:27 | 51.3 | 0 | 2/1/3/2/3 | core-gap | no |
| Medio | 2–3 | 09:27 | 46.3 ×2 | 0 | 2/1/2/2/3 | core-gap | no |
| Fuerte v1 | 1–3 | 09:27 | 80.0 ×3 | 80.0 | 3/3/4/3/3 | — | no |
| Fuerte v2 | 1 | 09:39 | 80.0 | 80.0 | 3/3/4/3/3 | — | no |
| Fuerte v2 | 2 | 09:39 | 80.0 | 80.0 | 3/3/4/3/3 | — | no |
| Fuerte v2 | 3 | 09:39 | 87.5 | 87.5 | 4/3/4/3/3 | — | **sí** |
| Débil (control) | 1 | 09:39 | 45.0 | 0 | 2/1/3/1/2 | core-gap | no |
| Medio (control) | 1 | 09:39 | 51.3 | 0 | 2/1/3/2/3 | core-gap | no |

## Lectura

- Débil y medio quedan siempre en 0 por `core-gap`; la separación de los casos incompletos es estable.
- Con el prompt numerado, la cobertura del fuerte sube a 4 en una de tres corridas; fidelidad, evidencia y trazabilidad se quedan en 3. Con 3/3/4/3/3 el total es 80.0 exacto y no califica; con un solo nivel más en cualquier dimensión, califica.
- Jev reporta confianza baja (`l`) en fidelidad, evidencia y trazabilidad del caso fuerte, y media en cobertura y alcance. No da un motivo por requisito. El feedback es la plantilla `feedback-template-m3-v1`: en las corridas de 80 dice que "hay requisitos del prompt que el código no implementa" y que "el código hace algo distinto en algunos valores, condiciones o casos límite"; en la de 87.5 señala comportamiento y evidencia. En la revisión manual no se encontró un requisito sin implementar.
- El criterio del plan (sin cambios de elegibilidad entre corridas) no se cumple: el caso fuerte es elegible en 1 de 3.

## Veredicto

`not ready` con `rubric-m3-v1`. No se cambió el umbral ni el alcance. Ese veredicto lo reemplaza el de `rubric-m3-v2`, más abajo.

## Puntaje continuo y `rubric-m3-v2`

Rama `feat/m3-continuous-scoring`. Mismo umbral (> 80), misma escala 0–4 y mismos casos, con diff ampliado a ±25 líneas de contexto. El total usa el valor esperado de cada dimensión y `core-gap` se activa si la probabilidad de niveles 0–2 en cobertura o fidelidad es ≥ 0.6. `rubric-m3-v2` solo cambia el descriptor de fidelidad. Sin `--record`.

Niveles esperados: cobertura / fidelidad / alcance / evidencia / trazabilidad. "P≤2" es la probabilidad de niveles 0–2 en cobertura y fidelidad.

| Rúbrica | Caso | Corrida | Rúbrica | Final | Niveles esperados | P≤2 cob / fid | Califica |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| v1 continuo | Fuerte v2 | 1–3 | 80.9 / 81.9 / 79.4 | igual | fidelidad ≈ 2.55 | — / 0.47 | 2 de 3 |
| v1 continuo | Débil | 1 | — | 0 | — | 0.71 / 0.97 | no (`core-gap`) |
| v1 continuo | Medio | 1 | — | 0 | — | 0.30 / 0.94 | no (`core-gap`) |
| v2 iter. 1 | Fuerte v2 | 1 | 83.8 | 83.8 | 3.49/3.04/3.77/3.19/3.12 | 0.10 / 0.30 | **sí** |
| v2 iter. 1 | Fuerte v2 | 2 | 83.9 | 83.9 | 3.46/3.01/3.79/3.25/3.19 | 0.09 / 0.33 | **sí** |
| v2 iter. 1 | Fuerte v2 | 3 | 83.7 | 83.7 | 3.49/3.03/3.78/3.19/3.09 | 0.09 / 0.31 | **sí** |
| v2 iter. 1 | Débil | 1 | 43.8 | 0 | 1.70/1.72/2.26/0.65/2.62 | 0.81 / 0.80 | no (`core-gap`) |
| v2 iter. 1 | Medio | 1 | 60.3 | 0 | 2.61/1.74/2.94/2.01/3.06 | 0.46 / 0.94 | no (`core-gap`) |

Con `rubric-m3-v2` se cumple el criterio: fuerte elegible 3 de 3, débil y medio en 0. Se hizo una sola iteración del descriptor. El margen del fuerte sobre el umbral es de unos 4 puntos.

### `rubric-m3-v2`: corridas adicionales (10:32–10:40)

Commit b678bef, ±25 líneas de contexto, sin `--record`. "Fuerte con desviación" es el caso fuerte con un solo valor principal de un requisito cambiado en el diff (fixture privado).

| Caso | Corrida | Rúbrica | Final | Niveles esperados | P≤2 cob / fid | Califica |
| --- | --- | ---: | ---: | --- | --- | --- |
| Fuerte v2 | 4 | 83.6 | 83.6 | 3.50/3.05/3.79/3.20/2.95 | 0.07 / 0.32 | sí |
| Fuerte v2 | 5 | 84.1 | 84.1 | 3.50/3.04/3.78/3.25/3.10 | 0.09 / 0.32 | sí |
| Fuerte v2 | 6 | 82.2 | 82.2 | 3.46/2.90/3.76/3.18/2.97 | 0.09 / 0.37 | sí |
| Fuerte v2 | 7 | 84.3 | 84.3 | 3.49/3.02/3.79/3.31/3.16 | 0.09 / 0.32 | sí |
| Fuerte v2 | 8 | 81.9 | 81.9 | 3.42/2.90/3.75/3.19/2.97 | 0.10 / 0.37 | sí |
| Fuerte v2 | 9 | 84.4 | 84.4 | 3.51/3.06/3.79/3.24/3.12 | 0.09 / 0.32 | sí |
| Fuerte v2 | 10 | 82.5 | 82.5 | 3.46/2.91/3.78/3.18/3.01 | 0.09 / 0.36 | sí |
| Fuerte v2 | 11 | 83.9 | 83.9 | 3.50/3.00/3.78/3.23/3.14 | 0.09 / 0.34 | sí |
| Fuerte v2 | 12 | 81.9 | 81.9 | 3.39/2.85/3.75/3.21/3.13 | 0.12 / 0.39 | sí |
| Fuerte v2 | 13 | 83.0 | 83.0 | 3.45/3.02/3.78/3.18/2.97 | 0.10 / 0.32 | sí |
| Débil | 1 | 45.8 | 0 | 1.90/1.75/2.38/0.61/2.59 | 0.75 / 0.79 | no (`core-gap`) |
| Débil | 2 | 44.3 | 0 | 1.81/1.68/2.29/0.62/2.59 | 0.77 / 0.80 | no (`core-gap`) |
| Débil | 3 | 44.6 | 0 | 1.93/1.63/2.27/0.62/2.50 | 0.74 / 0.83 | no (`core-gap`) |
| Medio | 1 | 57.6 | 0 | 2.52/1.64/2.71/2.01/2.96 | 0.53 / 0.95 | no (`core-gap`) |
| Medio | 2 | 60.3 | 0 | 2.61/1.75/2.83/2.01/3.25 | 0.47 / 0.91 | no (`core-gap`) |
| Medio | 3 | 61.3 | 0 | 2.67/1.79/2.93/2.02/3.16 | 0.41 / 0.92 | no (`core-gap`) |
| Fuerte con desviación | 1 | 58.9 | 0 | 2.55/1.50/3.38/2.22/2.07 | 0.46 / 0.99 | no (`core-gap`) |
| Fuerte con desviación | 2 | 61.0 | 0 | 2.67/1.80/3.31/2.20/1.99 | 0.38 / 0.97 | no (`core-gap`) |
| Fuerte con desviación | 3 | 61.5 | 0 | 2.72/1.62/3.29/2.21/2.48 | 0.31 / 0.99 | no (`core-gap`) |

Fuerte, 13 corridas (3 de la iteración 1 + 10): mínimo 81.9, máximo 84.4, media 83.3, desviación estándar 0.9; elegible en 13 de 13. Margen mínimo sobre 80: 1.9 puntos. Débil y medio quedan en 0 en todas las corridas. La variante con un valor cambiado queda en `core-gap` en 3 de 3: v2 sigue penalizando una desviación real.

### `rubric-m3-v2`: corridas tras la revisión de los PRs (11:12)

Commit 8e69bd7 (rutas en la detección de inyección y contexto incompleto). Mismos fixtures; ninguna corrida activó un hard-fail nuevo.

| Caso | Corrida | Rúbrica | Final | Niveles esperados | P≤2 cob / fid | Califica |
| --- | --- | ---: | ---: | --- | --- | --- |
| Fuerte v2 | 14 | 84.0 | 84.0 | 3.53/2.95/3.82/3.20/3.18 | 0.08 / 0.35 | sí |
| Fuerte v2 | 15 | 85.4 | 85.4 | 3.55/3.12/3.79/3.33/3.12 | 0.08 / 0.27 | sí |
| Fuerte v2 | 16 | 83.8 | 83.8 | 3.47/2.99/3.75/3.29/3.19 | 0.09 / 0.33 | sí |

Fuerte, 16 corridas: mínimo 81.9, máximo 85.4, elegible en 16 de 16.

## Reproducibilidad

Los fixtures quedan privados hasta el cierre de Misión 3 (decisión D2 en [`internal-contract.md`](internal-contract.md#decisiones-registradas)). Al cerrar la misión se versionan en `apps/community/fixtures/calibration-m3/` con los mismos bytes, para que estos hashes sigan sirviendo.

- **Modelo:** `jev-latest` pedido, `jev-1.14.0` resuelto en las 27 salidas de `rubric-m3-v2`.
- **Rúbrica y política:** `rubric-m3-v2` + `m3-policy` (puntaje continuo, `core-gap` con probabilidad de niveles 0–2 ≥ 0.6), feedback `feedback-template-m3-v2`.
- **Commits:** iteración 1 (corridas 1–3 del fuerte, débil 1, medio 1) con el árbol de b678bef antes del commit; corridas 4–13, débil 1–3, medio 1–3 y la variante, en b678bef; corridas 14–16 en 8e69bd7.
- **Fixtures:** los `cs-*` son los fixtures de 3 líneas (`passengers-*`) con el diff ampliado a ±25 líneas de contexto desde los archivos base; `cs-strongdev` es `cs-strong` con un solo valor principal cambiado. La primera calibración (`rubric-m3-v1`) usó `passengers-*`.
- **Comando** (un worktree privado en el commit indicado, `.env.local` con la llave de TypeSafe, `RECORD_ATTEMPTS=0`, sin `--record`), una vez por corrida:

```bash
cd <worktree>/apps/community
set -a; source ~/repos/metro_app/.env.local; set +a; export RECORD_ATTEMPTS=0
pnpm --filter @metro/community evaluate -- --fixture ~/m3-calib/private/fixtures/cs-<caso>.json </dev/null > <salida>.json
```

- **Verificar los hashes en el VPS** (los archivos son de solo lectura, modo 400):

```bash
cd ~/m3-calib/private
sed -n '/^```sha256$/,/^```$/p' <repo>/.ai/references/community/missions/mission-m3/calibration-2026-10-26-passengers.md \
  | grep -v '^```' | sha256sum -c -
```

Cada línea debe terminar en `OK`.

```sha256
8bb1f9bf62623c0a4a4666c2efe55afcf233f13e86e0375dd7196d75d00ead20  fixtures/passengers-weak.json
4180b7546f779f5edfa80d27b2073b28d902642c119618cef8ee30bb9174cafe  fixtures/passengers-mid.json
3e6576a03bc186ec9e14edc94a96ebee9c129b421880b102d088ed3567792f31  fixtures/passengers-strong.json
64c3da872e6d9cb781a6ef88039f183f1eb37dcdcb7718bb55beef71b912bae3  fixtures/passengers-strong-v2.json
421cfb880a9c8afa819d3ee39ae5df2372da91ebacad9f82e9be2a7100c4192d  fixtures/cs-weak.json
5b643e5c3b1854f88bc26c45b7d529fa242add95d576b865dd9086c3499730be  fixtures/cs-mid.json
78cd3acdb4554b3e18af6caec85575e20b9c2c7fd961fc28e7e48f50c7afa814  fixtures/cs-strong.json
b9ea1b87abd4ac8f71b95cf53d3cad17d5698af983942fa12d9e90af02259587  fixtures/cs-strongdev.json
83f450d39f8ed381e215711b41628442335ad08996b484d89c63ca17385cfd0d  runs-v2rub/it1/mid-1.json
3cce5b3a3492619bd0988bf26b21401d4a8e45a0e4c26b919423a0a41d28d49f  runs-v2rub/it1/strong-1.json
3b2f5a3d99e0ed1346995ff36f780ffd4c733ab0bf49559c2f2c7b7307cd5745  runs-v2rub/it1/strong-2.json
f7daa66e1ef41e3dbcb52f8c6b3d290b192bdc5aea807c192da84e99ef7babb4  runs-v2rub/it1/strong-3.json
22cccdf3c1b5de946d9cda7bffd9b5fa1e82ff6e685287042da51ae24fe81c8a  runs-v2rub/it1/weak-1.json
8c614c9b809b5c6a961e411d4247e0c17606a23646ca6b8a5a2dbc352c8fe855  runs-v2rub/more/mid-1.json
92402ac9838542552fb6c412bd6aa5e50ed8366db995d40389cc075523b9c7d7  runs-v2rub/more/mid-2.json
9af7559ac1b6c3a70b92d9028283322bf4729c1fe4428d755f397e94bb1a2282  runs-v2rub/more/mid-3.json
102ff9229ea922cf98cb8e186d3641ed969d5a8900ba3b695fc8165c93977053  runs-v2rub/more/strong-10.json
612a89bb4899ba218bc7e0f98a3aa7d872439002accdde348bd5cfec28117271  runs-v2rub/more/strong-11.json
d646797136c18d5f996a2e946f39767bb6b970f93d674785e50d01a638a27717  runs-v2rub/more/strong-12.json
134c2a722e01857e7452d1925145d1c987e9785809f131f1f769f5016daaf0bf  runs-v2rub/more/strong-13.json
e1506691de782bb3b4f45fa50af45e50c9047b42eed9661783af24e330412900  runs-v2rub/more/strong-4.json
843fbd4b3f4932f17cfd6058894f30c68647c98a8cb9b2277211f78a33a7592e  runs-v2rub/more/strong-5.json
859092f926fe96976f4f171f65057d90601e1ab83291a412c715d4ec02b72d46  runs-v2rub/more/strong-6.json
3b53144c75712f429bdded08f063e1faec71bed4455aa98f0eabcd40f54cb01e  runs-v2rub/more/strong-7.json
44088d6cae5213e55d4ffb198a918c00ad75b0bc9c416a41b068dbfa48d6b06b  runs-v2rub/more/strong-8.json
535d8d62b421ae6c85506e5a6ad932a8225a6bf26b52b7c7c7f4068d7f753aea  runs-v2rub/more/strong-9.json
d1d833ee7a8e4c21576c5e24db0bde9f46b1bf824384e5f5aa72bbad848585c4  runs-v2rub/more/strongdev-1.json
b426436244e8c04bb5a4aee6f0d385720f3935cfe2629707481666a6472a85f8  runs-v2rub/more/strongdev-2.json
bd217aca6cd861356147c025a3498cb97eb787588c02bea4bc7954bb1a94597f  runs-v2rub/more/strongdev-3.json
98f41611e08406221c9b4514e57c0387e199b4a76c82b5d98cb69ffb9c325274  runs-v2rub/more/weak-1.json
adeec2bbffdf53a7e42a8307d7ba141250d359c95b31b2f5e9d343852e5fce51  runs-v2rub/more/weak-2.json
70cbe8012a9858597fb4b2734263cb443ef09e57d5e257bf26c788d0b82e3371  runs-v2rub/more/weak-3.json
bc99d2978633fe9e17ab2ac345fd8fb0d869015769ef557ab829ac909a044079  runs-v2rub/review/strong-1.json
f4676b2d62ccfd9949355c2dd3556e78d1fb32e81ab6a12be50c2179793273c2  runs-v2rub/review/strong-2.json
48153afb2dae995ab5ccd001e5ba262c7b094c2949df75d6bf27bc5a00a50b62  runs-v2rub/review/strong-3.json
```
