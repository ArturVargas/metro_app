<!--
Plantilla para PRs de participantes hacia `dev`. Llena cada sección y no cambies los títulos `##`: un check automático los revisa.
No incluyas archivos .env, tokens, contraseñas, números de teléfono, capturas de chats privados ni conversaciones completas con tu LLM.
-->

## Participante y misión

Participante: p-XXX
Misión: mission-m3

## Prompt exacto

<!-- Pega el prompt tal como lo enviaste a tu LLM para producir esta versión del código, sin resumirlo. Si usaste varios prompts, pégalos en orden. -->

```text
PEGA AQUÍ TU PROMPT EXACTO
```

## SHA base de `dev`

<!-- El SHA completo (40 caracteres) publicado con la misión. -->

## Qué cambia

<!-- Describe el comportamiento que implementaste, en frases que alguien pueda comprobar en el juego. -->

-

## Pruebas ejecutadas

<!-- Escribe cada prueba y su resultado. Incluye los comandos y lo que probaste a mano (mouse, toque, pantalla). -->
<!-- Las pruebas del juego son manuales: escribe cada paso que hiciste en el juego y lo que observaste; si ayuda, agrega capturas o un video. `apps/game` no tiene runner de pruebas automáticas: no agregues uno ni modifiques `package.json` (es una ruta protegida). -->

- `pnpm lint`:
- `pnpm typecheck`:
- `pnpm build:web`:
- Prueba manual:

## Limitaciones conocidas

<!-- Lo que todavía no funciona o no probaste. Si no conoces ninguna, escribe "Ninguna conocida". -->

-

## Origen de los cambios

<!-- Marca una sola opción con [x] y explica qué generó el LLM y qué cambiaste a mano. -->

- [ ] LLM
- [ ] Manual
- [ ] Combinado

Explicación:

## Confirmación de privacidad

- [ ] Este PR no incluye archivos .env, tokens, contraseñas, números de teléfono ni conversaciones privadas.
