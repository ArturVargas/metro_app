# ADR-0004: Cliente universal del juego con Expo

- **Estado:** aceptada
- **Fecha:** 2026-09-28
- **Contexto:** la primera versión debe abrirse mediante un enlace, funcionar en navegadores móviles y de escritorio, y conservar una ruta directa hacia aplicaciones nativas para iOS y Android.

## Decisión

El cliente del juego se construirá con Expo, React Native Web y TypeScript. Usará componentes universales de React Native y `react-native-svg` para representar e interactuar con el mapa, las estaciones, las líneas y los trenes.

El motor de simulación será TypeScript puro, determinista y sin dependencias de React Native. La interfaz consumirá ese motor a través de contratos explícitos. La primera distribución será una aplicación web estática accesible por enlace; el mismo código de interfaz conservará compatibilidad con compilaciones nativas posteriores.

Referencias técnicas:

- [Desarrollo web con Expo](https://docs.expo.dev/workflow/web/)
- [Publicación de sitios Expo](https://docs.expo.dev/guides/publishing-websites/)
- [`react-native-svg` en Expo](https://docs.expo.dev/versions/v54.0.0/sdk/svg/)

## Alternativas consideradas

- React y Vite exclusivos para web: ofrecen un inicio web directo, pero obligarían a adaptar o reescribir la interfaz para una aplicación nativa posterior.
- Phaser u otro motor de juego basado en canvas: aportan capacidades que el mapa 2D del MVP no necesita y complican la reutilización nativa.
- Componentes DOM incrustados en una aplicación Expo: se reservan para excepciones; la pantalla de juego usará primitivas universales.

## Consecuencias

- Web, iOS y Android comparten componentes y lógica de interacción.
- El mapa se implementa con primitivas vectoriales suficientes para formas, trayectos e interacción del MVP.
- La simulación puede probarse sin renderizar la interfaz y migrarse sin depender de Expo.
- Las diferencias reales entre web y dispositivos deben verificarse durante el desarrollo.
- Las versiones del SDK y sus dependencias se fijarán al crear el baseline, usando versiones compatibles administradas por Expo.

## Reabrir si

- Las pruebas demuestran que SVG no mantiene el rendimiento requerido con el alcance real del MVP.
- Una capacidad esencial exige APIs del navegador sin alternativa universal razonable.
- La distribución nativa deja de ser una dirección prevista del producto.
