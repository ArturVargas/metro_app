# Misión 3 — borrador del mensaje público y del instructivo

- **Estado:** borrador; no enviado. Requiere aprobación de Artur antes de publicarlo.
- **Canal:** grupo Prompts de WhatsApp. El formato usa `*negrita*` de WhatsApp (un asterisco).
- **Pendiente antes de enviar:** reemplazar `[SHA_DEV]` por el SHA publicado de `dev` y `[FECHAS]` por el calendario de las Misiones 3–5.
- **Guía aplicada:** sección «Transición desde la Misión 3» de [`participant-onboarding.md`](../../participant-onboarding.md). No menciona al evaluador interno, teléfonos, contactos ni listas de acceso.

Envía cada bloque entre las líneas `---` como un mensaje separado. El brief funcional de la misión se publica aparte.

---

🚇 *Misión 3: ahora trabajamos sobre el código*

En las Misiones 1 y 2 enviaban un prompt y nosotros lo convertíamos en una versión del juego. Desde la Misión 3 cambia la dinámica: cada quien usa su propio LLM sobre el código real de Metro App, revisa lo que produjo y lo corrige.

Lo que queremos aprender ahora es a *supervisar a una IA sobre código real*, no solo a escribirle instrucciones.

*Cómo funciona*
• Todos parten del mismo punto: la rama `dev` del repositorio, fija en el commit `[SHA_DEV]` durante toda la misión.
• Haces un fork, trabajas en tu copia con tu LLM y abres un PR hacia `dev`.
• En el PR pegas el prompt exacto que usaste, explicas qué cambió, qué pruebas hiciste y qué partes hizo el LLM y cuáles hiciste a mano. La plantilla del PR te lo pide paso a paso.

*Evaluación*
• Cuando tu PR esté listo, menciona al bot con el enlace de tu PR. Cada evaluación usa uno de tus *cinco intentos* de la misión.
• La evaluación revisa si el código hace lo que dice tu prompt. Recibes un puntaje sobre 100 y feedback para corregir.
• Solo cuenta la evaluación más reciente y solo para ese commit. Si subes un commit nuevo, necesitas una evaluación nueva.

*Para llegar a A, B o C*
• Tu PR necesita *más de 80 puntos* y que pasen los checks automáticos (lint, typecheck, build y plantilla completa).
• Después entra a revisión técnica del equipo, en el orden en que calificó. Si encontramos un problema te diremos qué falla y cómo reproducirlo, pero no la solución.
• Los *primeros tres PRs aprobados* se convierten en las versiones A, B y C. En esta etapa no hay votación.
• El equipo integra y publica las versiones. Ningún PR se mezcla directo por su puntaje.

*Importante:* no incluyas archivos .env, contraseñas, tokens, datos personales ni copias de chats privados en tu PR.

Fechas: [FECHAS]. En el siguiente mensaje va el instructivo para hacer tu fork y abrir tu PR.

---

🛠️ *Cómo hacer tu fork y abrir tu PR*

Necesitas una cuenta gratuita de GitHub, Git, Node.js 22 y pnpm 8 (con `corepack enable` queda listo).

*1. Haz tu fork*
Abre https://github.com/ArturVargas/metro_app y pulsa *Fork*. Desmarca «Copy the main branch only» para que tu fork incluya `dev`.

*2. Descarga tu copia y crea tu rama*
```
git clone https://github.com/TU_USUARIO/metro_app.git
cd metro_app
git switch -c mision-3 [SHA_DEV]
pnpm install
```

*3. Trabaja con tu LLM*
Pídele que analice el código y haga los cambios de la misión. Revisa cada archivo que cambió. Guarda el prompt exacto que usaste.

*4. Prueba antes de subir*
```
pnpm lint
pnpm typecheck
pnpm build:web
pnpm --filter @metro/game web
```
Abre el juego y prueba con mouse y, si puedes, en el móvil. Anota qué probaste y qué pasó.

*5. Sube tu rama*
Revisa con `git status` que no aparezcan archivos .env ni otros que no quieras publicar. Después:
```
git add -A
git commit -m "Misión 3: descripción corta"
git push -u origin mision-3
```

*6. Abre el PR hacia dev*
En tu fork pulsa *Contribute → Open pull request*. Elige como base `ArturVargas/metro_app` y la rama `dev` (no `main`). Llena todas las secciones de la plantilla: tu identificador p-XXX, el prompt exacto, el SHA de `dev`, qué cambia, pruebas, limitaciones, origen de los cambios y la confirmación de privacidad.
Tu identificador es p- seguido de los últimos 3 dígitos de tu teléfono (por ejemplo, p-123). Si tu identificador lleva una letra al final (por ejemplo, p-123b), ya te lo enviamos: usa ese.

*7. Espera los checks y pide tu evaluación*
La primera vez, el equipo tiene que aprobar que los checks corran en tu PR; puede tardar un poco. Cuando estén en verde, menciona al bot con el enlace de tu PR.

*8. Corrige con el feedback*
Haz los cambios en la misma rama, sube un commit nuevo y actualiza en la descripción el prompt y las pruebas. Luego pide otra evaluación. Recuerda: máximo cinco por misión.

---
