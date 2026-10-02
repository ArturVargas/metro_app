# M1 A/B/C assignment — 2026-10-02

Solo llegaron **2 prompts** elegibles; se saltó la votación comunitaria.
Decisión de producto (Artur): A y B = un prompt cada uno (aleatorio); C = fusión de ambos.

## Asignación aleatoria (`random.SystemRandom`)

| Slot | Participant | Issue | Prompt |
| --- | --- | ---: | --- |
| **A** (`metro_a`) | `p-549` | #21 | conectar estaciones (borde rojo, rubber-band + drag/tap, circuitos, azul/verde/naranja) |
| **B** (`metro_b`) | `p-898` | #22 | conectar estaciones (anillo #555555, tap-tap, paleta Okabe–Ito, borrar tramo) |
| **C** (`metro_c`) | fusión A+B | #21+#22 | ver reglas de merge abajo |

Baseline común: `main` @ `44ebdfa` (o tip al crear las ramas).

## Reglas de merge para C

Conflictos resueltos así:

| Tema | Elección C | Origen |
| --- | --- | --- |
| Anillo de selección | gris `#555555` | B |
| Paleta de líneas | `#0072B2` / `#009E73` / `#CC79A7` (+ reuso al borrar) | B |
| Interacción móvil | solo tap-tap | B (evita scroll) |
| Interacción desktop | rubber-band con mouse | A |
| Grosor | 8 px | A |
| Hit target | ≥ 44×44 | B |
| Toast máximo | 2 s, "Máximo 3 líneas" | ambos |
| Circuitos (≥3 estaciones) | sí | A |
| Borrar línea tocando tramo | sí | B |

Estado local solamente; sin backend, pasajeros ni demanda. Las 8 estaciones del baseline no cambian.
