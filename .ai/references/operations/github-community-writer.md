# Operación del community writer en GitHub

## Cuándo usar este documento

Lee este documento para configurar el token del backend comunitario, diagnosticar errores `401`/`403` o ejecutar una prueba de persistencia. Para el contrato de datos, consulta ADR-0002 y ADR-0007; para evidencia real, consulta el reporte de persistencia de la Misión 1.

## Configuración del piloto

Para desarrollo local o el VPS del piloto:

- Usa un fine-grained personal access token creado por la cuenta propietaria `ArturVargas`.
- Limita el acceso a `ArturVargas/metro_app`.
- Concede únicamente `Issues: Read and write`; `Metadata: Read` queda implícito.
- Guarda el valor como `GITHUB_TOKEN` fuera del repositorio.
- Configura `GITHUB_OWNER=ArturVargas` y `GITHUB_REPO=metro_app`.

No uses para este repositorio personal un fine-grained token perteneciente a una cuenta colaboradora: GitHub puede permitir lectura y `git push`, pero rechazar la API de Issues con `403 Resource not accessible by personal access token`.

ADR-0002 mantiene una GitHub App como destino para una integración estable. El PAT es una credencial temporal del piloto y no cambia esa arquitectura.

## Flujo seguro de prueba

1. Ejecuta la evaluación sin `--record`.
2. Revisa el comentario exacto con `DRY_RUN=1`.
3. Obtén autorización antes de la primera escritura externa.
4. Persiste un participante sintético.
5. Verifica título, marcador, puntaje, procedencia y etiquetas mediante lectura de API.
6. Repite el mismo resultado para comprobar que no aparece otro comentario.
7. Cierra el Issue sintético para excluirlo del trabajo real.

## Reconciliación del Project

Después de corregir una falla de sincronización o de registrar intentos manualmente, reconstruye las filas de prompts desde los Issues abiertos:

```bash
pnpm --filter @metro/community project:reconcile
```

El comando requiere `GITHUB_TOKEN`, `GITHUB_PROJECT_TOKEN` y `GITHUB_PROJECT_NUMBER`. Omite misiones, pull requests e Issues cerrados; termina con código distinto de cero si alguna fila no pudo sincronizarse. Los Issues siguen siendo la fuente de verdad.

Nunca imprimas ni copies el token en logs, Issues, commits o mensajes. No uses un participante real para pruebas de integración.

## Dónde encontrar cada pieza

- Variables, comandos y modos: `apps/community/README.md`.
- Configuración de entorno: `apps/community/src/github/config.ts`.
- Persistencia: `apps/community/src/github/issue-store.ts`.
- Marcadores y etiquetas: `apps/community/src/github/markers.ts`.
- Evidencia viva: `.ai/references/community/missions/mission-m1/persistence-verification-2026-10-01.md`.

## Skills relacionadas

- `superpowers:systematic-debugging`: respuestas `401`/`403`, duplicados y estados parciales.
- `superpowers:verification-before-completion`: lectura posterior a cualquier prueba de escritura.
- `architecture-workflow`: migración de PAT a GitHub App o cambio de fuente de verdad.
