# Calibración TypeSafe — Misión 1 — 2026-09-30

- **Estado:** completada
- **Misión:** `mission-m1`
- **Rúbrica:** `rubric-m1-v1`
- **Modelo solicitado:** `jev-latest`
- **Persistencia:** desactivada; no crea Issues ni comentarios
- **Feedback:** `feedback-template-m1-v1`

## Objetivo

Comprobar con tres controles que la evaluación ordena la calidad de los prompts, mantiene un prompt débil debajo de 70 y reconoce como elegible un prompt fuerte. Esta calibración no autoriza cambios en la rúbrica ni en el umbral.

## Procedimiento

Los tres controles reciben exactamente [`public-brief.md`](public-brief.md) como contexto. Cada uno se evalúa una vez mediante TypeSafe. El backend calcula el total con los pesos de `rubric-m1-v1`; la confianza solo determina el enrutado.

## Controles predefinidos

| Control | Expectativa | Prompt exacto |
| --- | --- | --- |
| Débil | Menor que 70 | Haz que el tablero sea más divertido y conecta las estaciones de una manera bonita. |
| Cercano al umbral | Debe quedar entre el débil y el fuerte; sirve para observar el corte de 70 | Permite seleccionar dos estaciones y conectarlas con una línea visible. Conserva las ocho estaciones actuales. |
| Fuerte | Mayor o igual que 70 | Implementa en el tablero actual la interacción para seleccionar dos de las ocho estaciones, con mouse y pantalla táctil, y conectarlas. Al completar la conexión debe verse una línea clara entre los centros de ambas estaciones. Conserva las posiciones e identidades de las ocho estaciones y el cliente universal Expo/web. No agregues pasajeros, demanda ni backend del juego. Termina cuando una persona pueda abrir el build web, seleccionar dos estaciones, ver la línea y repetir la prueba en menos de un minuto. |

## Resultados

Las tres llamadas usaron `jev-latest`; TypeSafe resolvió `jev-1.13.0`. No se envió `--record` y no hubo escrituras en GitHub.

| Control | Total | Elegible | Niveles V/A/E/L | Enrutado | Tokens entrada/salida |
| --- | ---: | --- | --- | --- | ---: |
| Débil | 15.0 | No | 1 / 1 / 0 / 0 | `caution` | 1589 / 68 |
| Cercano al umbral | 63.8 | No | 3 / 2 / 3 / 2 | `caution` | 1595 / 68 |
| Fuerte | 100.0 | Sí | 4 / 4 / 4 / 4 | `caution` | 1683 / 68 |

`V/A/E/L` significa verificabilidad, instrucciones accionables, especificidad y límites de alcance. El backend generó en los tres casos feedback con puntaje, elegibilidad, fortaleza, hasta dos problemas y sugerencias, pregunta de revisión y metadatos `feedback-template-m1-v1`.

## Conclusión

La prueba cumple el criterio del spike: `15 < 63.8 < 100`, el control débil queda debajo de 70 y el fuerte queda encima. El control intermedio permaneció cerca del corte y fue penalizado en instrucciones accionables y límites, que eran precisamente sus omisiones.

No se propone cambiar `rubric-m1-v1`, sus pesos ni el umbral de 70 con esta evidencia.

## Observaciones abiertas

- Una sola ejecución por control demuestra separación básica, no estabilidad estadística alrededor de 70. Antes de aceptar evaluaciones reales conviene repetir controles cercanos al umbral.
- Los tres resultados quedaron en `routing: caution`. En el control fuerte, TypeSafe asignó confianza media a instrucciones accionables aunque otorgó nivel 4. El contrato actual indica que la confianza no cambia el puntaje; falta definir cómo atender `caution` en la operación del grupo antes de automatizar respuestas.
