# 🎯 Misión 3: Pasajeros en espera

**El problema**

Ya podemos crear líneas y poner trenes en movimiento, pero las estaciones siguen vacías: nadie espera el metro y los trenes no tienen a quién llevar.

**El objetivo**

Que, mientras la simulación corre, aparezcan pasajeros esperando en las estaciones y que cada uno muestre a qué tipo de estación quiere ir. En esta misión los pasajeros solo esperan: todavía no suben a los trenes.

**Contexto**

Prueba la versión de partida: https://metro-app-b.pages.dev/ (versión B de la Misión 2).

El código de partida es la rama `dev` del repositorio https://github.com/ArturVargas/metro_app, fija en el commit `acd8258ce3dcc45f01c449e47204b10aa7e45b7f` durante toda la misión. El tablero tiene ocho estaciones con tres formas: círculo, cuadrado y triángulo. **Ejecutar** pone en marcha los trenes asignados y **Parar** los detiene.

**Antes de escribir tu prompt, piensa**

- ¿Qué decisiones deja abiertas la misión y cuáles vas a tomar tú?
- ¿Qué debe ver el jugador mientras corre la simulación y mientras está en pausa?
- ¿Cómo vas a comprobar en el juego cada regla y cada caso límite?

Tú decides con qué frecuencia aparecen los pasajeros, cómo se reparten entre las estaciones, cómo se reparten sus destinos válidos y cómo se acomodan y se ven en el tablero. Las reglas siguientes son los rieles que debe respetar tu solución.

**Reglas**

- Cada pasajero espera en una estación de origen y muestra la forma de la estación a la que quiere ir: círculo, cuadrado o triángulo.
- La forma de destino siempre es distinta de la forma de la estación donde espera.
- Cada estación tiene como máximo doce pasajeros esperando. Si una estación ya tiene doce, no llega otro a esa estación.
- Los pasajeros empiezan a aparecer cuando hay al menos un tren asignado y el jugador pulsa **Ejecutar**. Sin un tren asignado, **Ejecutar** se comporta como hoy.
- **Parar** detiene la llegada de pasajeros. Al pulsar **Ejecutar** otra vez, la llegada continúa, sin que aparezcan de golpe los pasajeros que "habrían llegado" durante la pausa.
- En dos partidas nuevas, los primeros diez pasajeros aparecen en el mismo orden de estación de origen y forma de destino. El ritmo con el que se dibujan puede variar; ese orden no.
- Recargar la página inicia una partida nueva con las estaciones vacías, igual que el resto del juego.

**Debe mantenerse**

- Las ocho estaciones, la creación y edición de líneas (máximo tres), asignar y retirar trenes, y **Ejecutar**, **Parar** y **Reset**, con mouse y con toque.
- El estado local: sin guardado, sin backend del juego y sin dependencias nuevas.
- Sin abordaje: los pasajeros no suben a los trenes, no viajan, no bajan ni hacen transferencias, y los trenes no cambian su comportamiento.
- Una estación con doce pasajeros no provoca alertas, cuenta regresiva, puntaje, victoria ni derrota.
- Lo que pase al cambiar de pestaña o enviar la app a segundo plano no se evalúa en esta misión y no cuenta como pulsar **Parar**.
- No modifiques `package.json`, `pnpm-lock.yaml` ni otros archivos de configuración del repositorio. El juego no tiene un runner de pruebas automáticas y esta misión no pide instalar uno.

**Estará listo cuando**

- Después de crear una línea, asignarle un tren y pulsar **Ejecutar**, aparecen pasajeros con el paso del tiempo y en cada uno se reconoce su forma de destino, distinta de la de su estación.
- Al pulsar **Parar** durante un rato no aparecen pasajeros nuevos; al pulsar **Ejecutar** la llegada continúa sin acumular los de la pausa.
- Ninguna estación muestra más de doce pasajeros, aunque la simulación corra mucho tiempo.
- En dos partidas nuevas, los primeros diez pasajeros coinciden en estación de origen y forma de destino, en el mismo orden.
- En un teléfono, los pasajeros se distinguen sin tapar otra estación ni los controles, y todo lo que ya funcionaba sigue funcionando con mouse y con toque.

Tus pruebas son manuales: en tu PR escribe los pasos que seguiste en el juego y lo que observaste en cada uno. Si te ayuda, agrega capturas o un video.

**Cómo participar**

- Actualiza tu fork desde el commit de `dev` indicado en esta misión y crea una rama propia.
- Usa tu LLM para analizar el repositorio e implementar el objetivo.
- Abre un PR hacia `dev` e incluye tu prompt exacto, las pruebas realizadas y qué partes fueron generadas, corregidas manualmente o combinadas.
- Puedes solicitar hasta cinco evaluaciones. Cada evaluación corresponde al commit actual de tu PR.
- Para calificar, la revisión actual necesita más de 80 puntos, checks exitosos y aprobación técnica.
- Si recibes findings, corrige tu PR y solicita otra evaluación; no se te entregará el parche.

**Entrega de resultados**
Los primeros tres PRs que pasen todos los controles se convertirán, en orden, en A, B y C. El equipo administrará su integración y despliegue para que el grupo pueda probarlos y compararlos.
