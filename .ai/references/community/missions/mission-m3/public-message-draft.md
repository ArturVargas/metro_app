# Misión 3 — borrador del mensaje público y del instructivo

- **Estado:** aprobado por Artur; no enviado. Se publica al abrir la misión.
- **Canal:** grupo Prompts de WhatsApp. El formato usa `*negrita*` de WhatsApp (un asterisco).
- **Fechas (hora CDMX):** Misión 3 abre el viernes 30 de octubre de 2026 a las 06:00 hora CDMX y cierra el jueves 5 de noviembre a las 23:55 hora CDMX. Misión 4 abre el viernes 6 de noviembre y Misión 5 el viernes 13 de noviembre. Evaluaciones de martes a domingo, 06:00–23:55 hora CDMX. Calendario aprobado por Artur; decisiones D1, D4 y D7 en [`internal-contract.md`](internal-contract.md#decisiones-registradas).
- **Envío:** viernes 30 de octubre a las 06:00 hora CDMX, al activar la misión: primero el anuncio y justo después la guía del fork. Artur aprueba el texto exacto antes de enviarlo.
- **Pendiente antes de enviar:** la aprobación de Artur del texto exacto y la activación de Fortgate en hora CDMX (D7).
- **Guía aplicada:** sección «Transición desde la Misión 3» de [`participant-onboarding.md`](../../participant-onboarding.md). No menciona al evaluador interno, teléfonos, contactos ni listas de acceso.

Envía cada bloque entre las líneas `---` como un mensaje separado, en este orden. El anuncio enlaza al brief público en `main`.

---

🚇 *¡Arranca la Misión 3: Pasajeros en espera!*

Abre *hoy viernes 30 de octubre a las 6:00 am (hora CDMX)* y cierra el *jueves 5 de noviembre a las 23:55 (hora CDMX)*.

Desde esta misión trabajas con tu propio LLM sobre el código real de Metro App y lo supervisas tú.

📄 *Brief de la misión:*
https://github.com/ArturVargas/metro_app/blob/main/.ai/references/community/missions/mission-m3/public-brief.md

*Cómo participar*
1. Haz un fork de https://github.com/ArturVargas/metro_app (desmarca «Copy the main branch only»).
2. Crea tu rama desde `dev`, en el commit `1c60eea3b88962768dae0501e2cc9b8f20041b29`.
3. Trabaja con tu LLM, revisa los cambios y prueba con `pnpm lint`, `pnpm typecheck` y `pnpm build:web`.
4. Abre un PR hacia la rama `dev` (no `main`) y llena toda la plantilla: tu p-XXX, tu prompt exacto, el SHA de `dev`, qué cambia, tus pruebas y qué hizo el LLM.
5. Con los checks en verde, envíale el enlace de tu PR a @Fortgate, por mensaje directo o mencionándolo aquí.

*Evaluación*
• Tienes *5 intentos*; cada uno evalúa el commit más reciente de tu PR.
• Para entrar a revisión técnica necesitas *más de 80 puntos* y los checks en verde.
• Los *primeros 3 PRs aprobados* se convierten en las versiones A, B y C.
• Evaluamos de martes a domingo, de 6:00 a 23:55 (hora CDMX).

*Importante:* no subas archivos .env, contraseñas, tokens ni datos personales.

En el siguiente mensaje va el instructivo paso a paso para hacer tu fork y abrir tu PR. ¡Éxito! 🚀

---

🛠️ *Cómo hacer tu fork y abrir tu PR*

Necesitas una cuenta gratuita de GitHub, Git, Node.js 22 y pnpm 8 (con `corepack enable` queda listo).

*1. Haz tu fork*
Abre https://github.com/ArturVargas/metro_app y pulsa *Fork*. Desmarca «Copy the main branch only» para que tu fork incluya `dev`. Si se te olvidó, no pasa nada: el paso 2 lo cubre.

*2. Descarga tu copia y crea tu rama*
```
git clone https://github.com/TU_USUARIO/metro_app.git
cd metro_app
git remote add upstream https://github.com/ArturVargas/metro_app.git
git fetch upstream dev
git switch -c mision-3 1c60eea3b88962768dae0501e2cc9b8f20041b29
pnpm install
```

*3. Trabaja con tu LLM*
Pídele que analice el código y haga los cambios de la misión. Revisa cada archivo que cambió y guarda el prompt exacto que usaste.

*4. Prueba antes de subir*
```
pnpm lint
pnpm typecheck
pnpm build:web
pnpm --filter @metro/game web
```
Abre el juego y pruébalo con mouse y, si puedes, en el móvil. Anota qué probaste y qué pasó.

*5. Sube tu rama*
Revisa con `git status` que no aparezcan archivos .env ni otros que no quieras publicar. Después:
```
git add -A
git commit -m "Misión 3: descripción corta"
git push -u origin mision-3
```

*6. Abre el PR hacia dev*
En tu fork pulsa *Contribute → Open pull request*. Elige como base `ArturVargas/metro_app` y la rama `dev` (no `main`). Llena todas las secciones de la plantilla: tu p-XXX, el prompt exacto, el SHA de `dev` (`1c60eea3b88962768dae0501e2cc9b8f20041b29`), qué cambia, pruebas, limitaciones, origen de los cambios y la confirmación de privacidad.
Tu identificador es p- seguido de los últimos 3 dígitos de tu teléfono (por ejemplo, p-123). Si ya te enviamos uno con letra al final (por ejemplo, p-123b), usa ese.

*7. Espera los checks y pide tu evaluación*
La primera vez, el equipo tiene que aprobar que los checks corran en tu PR; puede tardar un poco. Cuando estén en verde, envíale el enlace de tu PR a @Fortgate, por mensaje directo o mencionándolo en el grupo.

*8. Corrige con el feedback*
Haz los cambios en la misma rama, sube un commit nuevo y actualiza en la descripción del PR el prompt y las pruebas. Luego pide otra evaluación. Recuerda: máximo 5 por misión.

---
