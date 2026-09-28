# Telemetría y observabilidad

## Requisitos confirmados

- PostHog analizará sesiones y comportamiento dentro del juego.
- Debe existir observabilidad de errores en producción.
- La telemetría no guarda el estado autoritativo de una partida.
- Los datos del experimento comunitario permanecen en GitHub, no en PostHog.

## Eventos iniciales del juego

- Inicio de partida.
- Finalización del tutorial.
- Creación o modificación de línea.
- Asignación de tren.
- Saturación de estación.
- Victoria o derrota.
- Reinicio.

## Privacidad

- Usar identificadores anónimos o seudónimos.
- No capturar números telefónicos, prompts ni secretos.
- Configurar enmascaramiento antes de habilitar reproducción de sesiones.
- Documentar retención y acceso antes de abrir la beta.

## Abierto

- Confirmar Sentry u otro proveedor para errores.
- Definir muestreo de session replay.
- Definir alertas mínimas y responsables.
- Definir cómo se relacionan release, commit y reporte de error.
