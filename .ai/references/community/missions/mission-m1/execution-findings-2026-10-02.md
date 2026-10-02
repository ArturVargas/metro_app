# Findings de ejecución — Misión 1 — 2026-10-02

## Alcance

Revisión de fidelidad y seguridad de las variantes producidas desde el baseline `44ebdfa`.

| Variante | Prompt | Participante | PR | Commit |
| --- | --- | --- | --- | --- |
| A | original | `p-549` | #23 | `3a40c45479d604f2a4162231af2247ae18d82213` |
| B | original | `p-898` | #24 | `0af361b5d795dc538c6226a5ed253b68521497bf` |
| C | compuesto A+B | `p-549` + `p-898` | #25 | `089013fbf9e3ce1b68f1f37f6c71be1ec27fa708` |

Entornos observados: web desktop `1280×900` y web móvil `360×800`. En el viewport móvil el tablero renderizó a `328×246` px, escala `0.82` respecto al `viewBox` `400×300`.

Los findings no cambian los puntajes `100/100` ni crean nuevos intentos.

## Variante A — PR #23

### M1-A-001

- **Tipo / severidad:** `execution-gap` / `high`
- **Requisito:** seleccionar con clic o toque, mantener el borde rojo y permitir toque-toque; en desktop la guía debe seguir al mouse.
- **Observado:** un clic o toque sobre una estación termina sin selección (`0` anillos y `0` líneas guía). El arrastre sí puede crear una línea.
- **Evidencia:** reproducido en desktop y viewport móvil sobre el build web. La variante combina responders del `View` con `onPress` de los hit targets y procesa el mismo gesto por ambas rutas.
- **Impacto:** toque-toque y rubber-band no se pueden usar como pide el prompt.
- **Estado:** `open`.

### M1-A-002

- **Tipo / severidad:** `execution-gap` / `medium`
- **Requisito:** toda la figura seleccionada muestra un borde rojo conservando su forma.
- **Observado:** `StationMark` dibuja un `Circle` como indicador para círculos, cuadrados y triángulos.
- **Impacto:** cuadrados y triángulos reciben un anillo circular, no un borde de su figura.
- **Estado:** `open`.

### M1-A-003

- **Tipo / severidad:** `platform-gap` / `medium`
- **Requisito:** líneas de `8 px`.
- **Observado:** el trazo de 8 unidades del SVG renderiza a `6.56 px` con tablero de 328 px de ancho.
- **Impacto:** el grosor cambia con el viewport y queda por debajo del valor pedido en móvil.
- **Estado:** `open`.

## Variante B — PR #24

### M1-B-001

- **Tipo / severidad:** `platform-gap` / `medium`
- **Requisito:** área tocable mínima de `44×44 px`.
- **Observado:** el círculo de hit target renderiza a `36.08×36.08 px` en viewport móvil de 360 px.
- **Impacto:** incumple el mínimo táctil explícito.
- **Estado:** `open`.

### M1-B-002

- **Tipo / severidad:** `platform-gap` / `medium`
- **Requisito:** trazo recto de al menos `6 px`.
- **Observado:** el trazo de 6 unidades del SVG renderiza a `4.92 px` en el mismo viewport.
- **Impacto:** el grosor visible queda por debajo del mínimo pedido.
- **Estado:** `open`.

La selección, conexión toque-toque y primera línea azul funcionaron en el smoke test.

## Variante C — PR #25

### M1-C-001

- **Tipo / severidad:** `execution-gap` / `high`
- **Requisito:** rubber-band desktop que sigue al mouse.
- **Observado:** React Native Web no emitió `data-metro-board="c"`; el selector devuelve `null` y la guía permanece con inicio y fin en `60,70` después de mover el puntero.
- **Impacto:** no existe previsualización útil en desktop.
- **Estado:** `open`.

### M1-C-002

- **Tipo / severidad:** `platform-gap` / `medium`
- **Requisito:** hit target mínimo de `44×44 px`.
- **Observado:** renderiza a `36.08×36.08 px` en viewport móvil de 360 px.
- **Impacto:** incumple el mínimo táctil elegido para C.
- **Estado:** `open`.

### M1-C-003

- **Tipo / severidad:** `platform-gap` / `medium`
- **Requisito:** grosor de `8 px`.
- **Observado:** renderiza a `6.56 px` en el mismo viewport móvil.
- **Impacto:** el grosor cambia con la escala y queda por debajo del valor elegido.
- **Estado:** `open`.

Funcionaron toque-toque, extensión, circuito, tres colores, límite de tres líneas, mensaje de límite, eliminación completa y reutilización del color.

## Seguridad

No se encontraron `security-blocker`. Las tres variantes mantienen estado local y no agregan entrada de texto, backend, persistencia, llamadas de red, HTML dinámico ni ejecución dinámica de código.

## Verificación común

- GitHub Actions: `Lint, typecheck, and web build` exitoso en #23, #24 y #25.
- Repetición local: lint, typecheck y export web exitosos para A, B y C.
- La evidencia funcional se obtuvo sobre los builds exportados, no solo leyendo el código.
