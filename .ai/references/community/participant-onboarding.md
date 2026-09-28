# Incorporación de participantes

## Cómo usar este documento

Este archivo define el contenido que recibe la comunidad antes de la primera misión. Úsalo para redactar mensajes de WhatsApp, respuestas de Hermes y la guía fijada en el grupo. Las reglas técnicas internas permanecen en [`experiment-rules.md`](experiment-rules.md) y en los ADRs; no deben copiarse automáticamente a mensajes para participantes.

## Formato aprobado

- Una secuencia de cuatro o cinco mensajes breves en el grupo de WhatsApp.
- Un mensaje índice fijado para consultar las reglas después.
- Lenguaje directo para personas con experiencia técnica básica o nula.
- La información se entrega antes de la primera misión, sin convertirla en un manual largo.

## Secuencia aprobada

1. **Bienvenida y propósito:** qué se construirá y por qué el grupo participa.
2. **Qué es Metro App:** explicación breve del juego, su estado inicial y el resultado funcional buscado.
3. **Cómo participar:** misión común, envío de prompts, uso del feedback y señales de contenido genérico o imposible de comprobar.
4. **Evaluación e intentos:** puntuación, feedback, máximo de cinco intentos y requisito de 70 puntos para la versión calificable más reciente.
5. **Votación y construcción:** selección comunitaria, asignación aleatoria A/B/C, condiciones equivalentes y trazabilidad del prompt.

El mensaje fijado funciona como índice de estas explicaciones e incluye reglas esenciales y comandos disponibles.

## Mensajes aprobados

### 1. Bienvenida y propósito

> 👋 Bienvenidos.
>
> En este grupo vamos a construir juntos **Metro App**, un pequeño juego de estrategia sobre cómo diseñar y mejorar una red de transporte.
>
> También haremos un experimento: aprender a convertir ideas en instrucciones claras, específicas y comprobables que una herramienta de IA pueda transformar en cambios reales del producto.
>
> No necesitan saber programar. Su trabajo será entender cada misión, proponer una solución mediante un prompt y mejorarlo usando el feedback que recibirán.
>
> El objetivo no es escribir de forma complicada ni parecer técnico. El objetivo es comunicar una buena idea con suficiente claridad para que pueda construirse y probarse.
>
> Si el experimento funciona, terminaremos con un juego funcional creado a partir de las mejores contribuciones del grupo.

### 2. Qué es Metro App

> 🚇 **¿Qué es Metro App?**
>
> Metro App será un juego de estrategia inspirado en el transporte de Ciudad de México. No busca copiar la ciudad ni predecir su funcionamiento: será una ciudad abstracta con patrones de demanda inspirados en datos reales.
>
> En cada partida habrá ocho estaciones. La persona jugadora podrá crear hasta tres líneas y asignar cuatro trenes para mover pasajeros entre ellas.
>
> La demanda cambiará con el tiempo. Si una estación permanece llena durante 30 segundos, la partida termina. El objetivo será mantener la red funcionando durante siete días simulados.
>
> La primera versión será gratuita y se abrirá mediante un enlace, tanto en computadora como en teléfono. Queremos que sea pequeña, clara y completamente jugable.
>
> Todavía no estamos intentando construir todas las funciones posibles. Cada misión trabajará sobre una parte específica para avanzar sin perder el control del producto.

### 3. Cómo participar

> ✍️ **¿Cómo participamos?**
>
> En cada misión todos recibirán el mismo objetivo, contexto y límites. Su tarea será escribir un prompt que explique:
>
> - Qué quieren cambiar.
> - Cómo debe funcionar.
> - Qué no debe modificarse.
> - Cómo comprobar que funciona.
>
> Pueden usar una IA para ayudarse, pero deben revisar el resultado. Eviten frases vagas como “mejora el juego” o “hazlo más profesional”.
>
> En vez de “haz más clara la congestión”, escriban algo comprobable: “Con 10 pasajeros, la estación cambia a amarillo; con 12, cambia a rojo y muestra la cuenta de 30 segundos”.
>
> No gana el prompt más largo, sino el que permite construir mejor.

### 4. Evaluación e intentos

> 📊 **Evaluación e intentos**
>
> Para enviar un prompt deben mencionar al bot en el mensaje. El bot solo realizará evaluaciones los martes y jueves.
>
> Cada evaluación devuelve una puntuación sobre 100 y feedback para mejorar. Tienen un máximo de cinco intentos por misión, repartidos como prefieran entre esos dos días.
>
> Para entrar a la votación necesitan al menos 70 puntos. Si varias versiones superan ese puntaje, participará únicamente la más reciente.
>
> La puntuación solo indica que el prompt está listo para competir. La comunidad elige cuáles tres se construirán.

### 5. Votación y versiones

> 🗳️ **Votación y versiones**
>
> Al cerrar los envíos, el bot publicará los prompts que alcanzaron 70 puntos o más.
>
> Cada participante elegirá tres prompts distintos y no podrá votar por el propio. Los tres más votados se asignarán aleatoriamente a las versiones A, B y C.
>
> Las tres versiones se construirán desde el mismo punto y bajo las mismas condiciones. Siempre podremos ver quién escribió cada prompt y qué versión produjo.
>
> Cada viernes publicaremos tres enlaces para que prueben A, B y C, comparen los resultados y compartan lo que observaron.
>
> Ninguna versión se convierte automáticamente en la definitiva. Primero revisaremos qué funcionó y qué debemos aprender para la siguiente misión.

## Contenido obligatorio

- Qué es Metro App y qué resultado se quiere construir.
- Qué está experimentando la comunidad: aprender a convertir ideas en instrucciones claras y comprobables.
- Qué papel tiene cada participante.
- Cómo enviar, revisar y optimizar un prompt.
- Cada evaluación devuelve una puntuación y feedback accionable.
- Cada participante tiene un máximo de cinco intentos por misión.
- Solo la versión calificable más reciente, con puntuación mayor o igual a 70, entra a la votación.
- El bot solo evalúa mensajes que lo mencionen y solo durante martes y jueves.
- La comunidad elige tres prompts y estos producen las versiones A, B y C.
- Las versiones muestran qué participante y qué prompt las originaron.
- Cada viernes se publican los enlaces A, B y C para probar, comparar y compartir los resultados.
- Qué señales de AI slop deben evitarse: texto vago, inflado, repetitivo, contradictorio o imposible de comprobar.

## Contenido que no se comunica

- El nombre Jev.
- Detalles de modelos, proveedores, claves, rúbricas internas o infraestructura.
- Promesas de que una puntuación alta garantiza que el resultado construido será el mejor.

## Estado

El formato, los límites de contenido y los cinco mensajes están aprobados. El índice fijado todavía debe redactarse y aprobarse.
