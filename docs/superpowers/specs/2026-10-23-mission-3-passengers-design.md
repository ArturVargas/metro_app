# Misión 3 — pasajeros en espera

## Intención

Misión 3 abre la fase en la que cada participante trabaja sobre el repositorio real, usa su propio LLM, revisa el código generado y entrega un pull request hacia `dev`. La misión debe añadir una parte reconocible del juego final y, al mismo tiempo, caber en un PR pequeño que pueda evaluarse por correspondencia entre prompt y código.

El resultado elegido es incorporar pasajeros visibles en espera. Esto conecta el movimiento de trenes construido en Misión 2 con el futuro sistema de viajes, sin exigir todavía rutas, abordaje, transferencias ni condiciones de derrota.

## Objetivos

- Mostrar pasajeros que aparecen progresivamente en las ocho estaciones mientras la simulación está activa.
- Representar en cada pasajero la forma de su destino: círculo, cuadrado o triángulo.
- Evitar destinos de la misma forma que la estación de origen.
- Respetar un máximo de doce pasajeros esperando por estación.
- Detener la generación al pausar y continuarla al reanudar la simulación.
- Producir la misma secuencia de pasajeros al repetir una partida con el mismo estado inicial y las mismas acciones.
- Mantener funcionando las líneas, los trenes y los controles existentes en escritorio y teléfono.

## Fuera de alcance

- Los pasajeros no abordan trenes, viajan, bajan ni hacen transferencias.
- Los trenes no cambian su comportamiento por la presencia de pasajeros.
- Una estación con doce pasajeros no inicia alertas, cuenta regresiva, derrota ni puntuación.
- No se agregan días, victoria, derrota, demanda basada en datos, guardado ni backend del juego.
- No se cambian las ocho estaciones, el límite de líneas ni el comportamiento aprobado de Misión 2.
- No se añaden dependencias ni se modifican rutas protegidas para resolver la misión.

## Reglas fijas del producto

1. Un pasajero pertenece a una estación de origen y expresa un destino mediante una forma.
2. La forma de destino siempre es distinta de la forma de la estación donde espera.
3. Cada estación muestra como máximo doce pasajeros. Cuando alcanza el límite, la generación no añade otro pasajero a esa estación.
4. Los pasajeros solo se generan durante el tiempo activo de la simulación. Una pausa no consume tiempo de generación ni altera la secuencia pendiente.
5. Dos partidas nuevas con las mismas acciones y tiempos de simulación producen la misma secuencia observable de orígenes y destinos.
6. Recargar inicia una partida nueva y vacía las colas de pasajeros, igual que el resto del estado local.

Estas reglas son criterios de producto. El brief no prescribe componentes, estructuras de datos, temporizadores ni algoritmos.

## Decisiones del participante

Cada participante debe decidir y expresar en su prompt:

- con qué frecuencia aparecen pasajeros;
- cómo se distribuyen entre las estaciones;
- cómo se distribuyen las formas de destino válidas;
- cómo se acomodan y representan visualmente los pasajeros en espera;
- cómo comprobará los comportamientos principales y los casos límite.

El código del PR debe corresponder con esas decisiones. Diferentes participantes pueden producir experiencias distintas y aun cumplir la misión.

## Criterios observables de aceptación

- Al iniciar o reanudar la simulación, aparecen pasajeros con el paso del tiempo sin interacción adicional.
- Cada pasajero permite reconocer si busca un círculo, un cuadrado o un triángulo, y esa forma difiere de la estación donde espera.
- Pausar durante un intervalo suficiente impide que aparezcan pasajeros nuevos; al reanudar, la generación continúa.
- Ninguna estación muestra más de doce pasajeros, incluso después de dejar correr la simulación.
- Dos partidas limpias sometidas a la misma secuencia de acciones producen la misma secuencia de pasajeros.
- Crear y modificar líneas, asignar o retirar trenes, pausar, reanudar y usar el juego mediante ratón o toque sigue funcionando.

La revisión puede comprobar estos resultados manualmente. El participante elige evidencia adicional y la registra en el PR.

## Restricciones técnicas y operativas

- Repositorio: `ArturVargas/metro_app`.
- Modalidad: fork del participante y PR hacia `dev`.
- Baseline de apertura previsto: `acd8258ce3dcc45f01c449e47204b10aa7e45b7f`; debe volver a verificarse antes de publicar.
- Área de cambio esperada: `apps/game/`.
- Cliente universal Expo/React Native Web, sin backend del juego.
- Máximo de cinco evaluaciones por participante; cada evaluación pertenece al HEAD exacto del PR.
- El PR necesita más de 80 puntos, checks exitosos y aprobación técnica.
- Los tres primeros PRs aprobados ocupan A, B y C por orden.

El brief público explica resultados y límites en lenguaje cotidiano. No menciona TypeSafe, pesos, hard-fails ni una solución técnica.

## Riesgos y controles

- **La misión crece hasta implementar todo el transporte:** el brief separa expresamente espera de abordaje y rutas.
- **Los resultados no son comparables:** las reglas fijas permiten comprobar el núcleo; las decisiones abiertas se comparan contra el prompt declarado de cada participante.
- **La aleatoriedad vuelve irreproducible un finding:** la reproducibilidad es un criterio obligatorio, aunque el mecanismo quede abierto.
- **La interfaz deja de caber en móvil:** la revisión prueba una vista de teléfono y exige que los pasajeros no oculten controles ni impidan usar las estaciones.
- **El límite de doce se interpreta como derrota:** en esta misión solo detiene nuevas llegadas a esa estación.
- **Un prompt copia una solución completa del brief:** el documento público evita intervalos, probabilidades, layout y detalles de implementación.

## Enfoques considerados

### Objetivo completamente abierto

Pedir únicamente “agrega pasajeros” maximiza la libertad, pero no ofrece una base objetiva para revisar comportamiento ni distinguir una implementación incompleta. Se descartó.

### Especificación completa

Fijar intervalos, probabilidades, colores, posiciones y algoritmo haría las variantes fáciles de comparar, pero reduciría el ejercicio a traducir instrucciones. Se descartó porque el participante debe tomar decisiones y supervisar a su LLM.

### Reglas fijas con decisiones abiertas — elegido

El producto fija el significado del pasajero, pausa, capacidad, reproducibilidad y límites. El participante define frecuencia, distribución, aspecto y verificación. Este equilibrio conserva una misión evaluable y crea espacio real para analizar y escribir un buen prompt.

## Trabajo posterior a la aprobación

1. Sustituir el stub de `mission-m3/public-brief.md` por el brief público.
2. Crear el contrato interno de Misión 3 y mapear cada criterio público a la rúbrica existente.
3. Preparar casos débil, medio y fuerte del tamaño esperado y recalibrar `rubric-m3-v1`.
4. Completar fechas en el mensaje público.
5. Ejecutar un ensayo desde un fork con evaluación sin registro y luego con el flujo controlado.
6. Aplicar y verificar los cambios de Hermes en el VPS antes de activar `mission-m3`.

## Progresión prevista

- **Misión 4:** abordar, transportar, bajar y transferir pasajeros.
- **Misión 5:** demanda variable, saturación, cuenta regresiva y cierre por victoria o derrota.

Estas dos misiones son orientación de producto. Su alcance detallado se decidirá después de observar Misión 3.
