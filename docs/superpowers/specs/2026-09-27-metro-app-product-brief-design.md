# Metro App — Product Brief

## 1. Propósito

Metro App es un juego de estrategia ligero para una ciudad abstracta inspirada en Ciudad de México. La persona jugadora diseña una red pequeña de metro, asigna trenes y reacciona a cambios de demanda para evitar que las estaciones se saturen.

El producto también es el objetivo compartido de un experimento educativo: una comunidad de personas sin experiencia técnica, o con experiencia básica, aprende a formular mejores solicitudes para herramientas de IA mediante contribuciones acotadas a un juego real.

La hipótesis del juego es que patrones temporales y direccionales inspirados en datos reales producen decisiones más interesantes que una demanda completamente aleatoria, sin convertir el producto en un simulador urbano complejo o en una herramienta de predicción.

## 2. Público y propuesta de experiencia

El MVP sirve a dos públicos:

- Personas que disfrutan juegos de estrategia accesibles y no necesitan conocer transporte público.
- Personas interesadas en movilidad y urbanismo que valoran que el comportamiento del juego tenga una referencia explicable.

La promesa principal es simple: crear una red, observar cómo cambia la ciudad y reorganizarla antes de que se congestione. La experiencia sigue este ciclo: conectar estaciones, asignar trenes, simular, observar, pausar, reorganizar y sobrevivir o reiniciar.

## 3. Alcance jugable del MVP

Una partida tiene estas reglas fijas:

- Ciudad abstracta con ocho estaciones de formas circulares, triangulares o cuadradas.
- Hasta tres líneas; cada línea es una secuencia ordenada y no ramificada de estaciones.
- Cuatro trenes idénticos, con capacidad para seis pasajeros cada uno.
- Cada estación admite hasta doce pasajeros esperando.
- La partida dura siete días simulados; cada día dura 90 segundos.
- Se pierde si una estación permanece llena, con sus doce plazas de espera ocupadas, durante 30 segundos continuos. Se gana al terminar el séptimo día.
- La persona jugadora puede crear y modificar líneas, asignar trenes y pausar o reanudar. La edición de líneas ocurre en pausa; un tren termina su trayecto actual antes de adoptar una línea modificada.
- Los trenes circulan automáticamente, se detienen, recogen y dejan pasajeros, y recorren sus líneas de ida y vuelta a velocidad constante.
- Los pasajeros eligen rutas según el menor tiempo estimado; se permiten transferencias.
- La demanda varía por origen, destino y hora simulada. La simulación usa una semilla fija para que las mismas acciones produzcan el mismo resultado.

No habrá puntuación, dinero, fichas, mejoras, desbloqueos, estaciones nuevas durante la partida, cuentas, guardados, multijugador, chat ni IA generativa dentro del juego.

## 4. Datos y simulación

La demanda se alimentará de un conjunto de datos preprocesado y versionado; no habrá una API en tiempo real. El producto distinguirá claramente tres tipos de información:

- **Basado en datos:** patrones horarios y direccionales usados como referencia.
- **Estimado:** valores derivados cuando los datos disponibles no bastan.
- **Diseñado para el juego:** capacidad, velocidad, duración de los días y condiciones de victoria o derrota.

Metro App no afirma predecir el funcionamiento real de CDMX. Los datos sirven para crear patrones reconocibles y decisiones estratégicas, no para hacer una simulación científica.

## 5. Dirección visual y pantalla de juego

La interfaz seguirá la estética de un diagrama de metro contemporáneo: fondo claro, estaciones grandes, líneas de colores sólidos y trenes fáciles de identificar. Debe leerse con la misma claridad en escritorio y en pantalla móvil.

El mapa ocupa el centro de la pantalla. Las estaciones muestran su forma, los pasajeros esperando y un estado visual de riesgo. El color progresa de normal a amarillo y rojo; al entrar en saturación se muestra una cuenta visible de 30 segundos. Las líneas y trenes se distinguen de inmediato.

Los controles no cubren el mapa: pausar o reanudar, crear o editar una línea, asignar un tren y ver el día simulado y el tiempo restante. Al ganar o perder, aparece un cierre sencillo con opción de reiniciar. No habrá panel de métricas ni tablero analítico dentro de la partida.

## 6. Entrada y aprendizaje

El enlace abre directamente una introducción corta: conectar estaciones, asignar trenes y evitar saturaciones. Después, una guía práctica enseña a crear una primera línea, asignar un tren, iniciar la simulación y pausar para ajustar la red ante un riesgo.

Al completar esos pasos, las ayudas desaparecen y pueden abrirse otra vez desde un control discreto. El lenguaje será cotidiano: "estación llena", "tren asignado" y "cambia la ruta". La explicación técnica queda fuera del flujo principal.

## 7. Transparencia opcional

Una pantalla de ayuda, disponible desde el inicio y durante la pausa, explica el origen de los patrones de demanda y la distinción entre datos, estimaciones y parámetros de balance. Esta información no debe interrumpir la partida ni convertirse en un panel de gráficas.

## 8. Plataforma

La primera versión se distribuye gratuitamente mediante un enlace público. El juego debe ser funcional y equivalente en navegadores de escritorio y móviles, con controles de ratón y táctiles.

La arquitectura debe dejar abierta una futura versión móvil nativa. React Native es la primera opción que se evaluará al decidir el stack, pero no es una decisión de implementación tomada en este brief.

## 9. Comunidad y contribuciones

El juego y el sistema de comunidad se mantienen separados técnicamente en el MVP. La comunidad trabaja mediante misiones externas y limitadas: mejorar una pantalla, aclarar un mensaje, proponer una interacción o hacer visible un estado del juego.

Cada misión tiene un objetivo, límites y una definición de listo. Las propuestas se agrupan y revisan antes de transformarse en una especificación técnica. Las decisiones sobre reglas de simulación, datos, arquitectura y alcance final siguen bajo aprobación del responsable del producto.

El sistema no requiere cuentas, mensajería, votaciones ni integración directa con WhatsApp dentro del juego para validar el experimento.

## 10. Criterios de éxito

El MVP se considera exitoso si:

- Una persona puede abrir el enlace, comenzar una partida y reiniciarla sin bloqueos.
- La partida es funcional tanto en escritorio como en móvil.
- Las personas entienden visualmente cómo crear líneas, asignar trenes y responder a la congestión.
- Los viajes y transferencias de pasajeros funcionan.
- La demanda cambia de forma perceptible y obliga a tomar decisiones.
- Modificar líneas o trenes cambia el resultado de la partida.
- La simulación es determinista con la misma semilla y las mismas acciones.
- Es posible ganar al terminar el día siete o perder por saturación.

El experimento comunitario se considera exitoso si se obtiene una versión funcional y jugable mediante contribuciones acotadas, y si los prompts de los participantes mejoran: son más específicos, comprobables y coherentes, y reducen contenido vago, inflado, repetitivo, contradictorio o imposible de verificar. La participación sostenida es deseable y se promoverá, pero no es un criterio de aprobación inicial ni depende de cobro.

## 11. Exclusiones explícitas

Quedan fuera de este MVP: economía o compras, rankings, logros, tipos distintos de tren, ciudades adicionales, editor de mapas, datos en tiempo real, blockchain o tokens, reportes B2B, panel analítico y una integración directa con la operación de comunidad.
