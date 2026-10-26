# Deployments de Cloudflare

## Cómo usar este documento

Usa esta referencia para publicar el estado base o una variante A/B/C. Cada despliegue reemplaza una ranura estable, por lo que debe ejecutarse de forma supervisada desde un commit o rama explícitos y después de pasar las validaciones del juego.

## Ranuras estables

| Ranura | Proyecto de Cloudflare | URL estable | Uso |
| --- | --- | --- | --- |
| Base | `metro-app-base` | https://metro-app-base.pages.dev/ | Estado común que reciben los participantes antes de una misión |
| A | `metro-app-a` | https://metro-app-a.pages.dev/ | Primera variante seleccionada según la modalidad de la misión |
| B | `metro-app-b` | https://metro-app-b.pages.dev/ | Segunda variante seleccionada según la modalidad de la misión |
| C | `metro-app-c` | https://metro-app-c.pages.dev/ | Tercera variante seleccionada según la modalidad de la misión |

Los cuatro proyectos existen en Cloudflare Pages. Consulta el contrato de la misión y su reporte de ejecución para conocer el commit vigente de cada ranura; los valores históricos no deben tratarse como estado actual.

## Despliegue desde GitHub Actions

El workflow [`.github/workflows/deploy-cloudflare-slot.yml`](../../../.github/workflows/deploy-cloudflare-slot.yml) se ejecuta manualmente y exige:

- `slot`: `base`, `a`, `b` o `c`.
- `ref`: rama, tag o SHA completo que se construirá.
- Secret `CLOUDFLARE_API_TOKEN` con permiso para desplegar Pages.
- Secret `CLOUDFLARE_ACCOUNT_ID` de la cuenta propietaria.

El workflow instala desde el lockfile, ejecuta lint, tipos y build, rechaza un `_worker.js` inesperado y despliega el artefacto estático a la ranura elegida. Ejecuta Wrangler con `pnpm dlx` porque `wrangler-action` intenta añadir Wrangler a la raíz del workspace y pnpm rechaza esa instalación. No se ejecuta automáticamente al hacer push.

## Despliegue local supervisado

Con Wrangler autenticado, construye el commit actual y despliega desde la raíz del repositorio:

```bash
pnpm build:web
pnpm dlx wrangler@4.143.0 pages deploy apps/game/dist \
  --project-name metro-app-<base|a|b|c> \
  --branch main \
  --commit-hash <SHA-completo> \
  --commit-dirty=false
```

No uses `--force` al desplegar. Ese indicador solo fue necesario una vez para crear los proyectos Pages y evitar la delegación automática a Workers.

## Reglas operativas

- Base cambia únicamente después de la aprobación del responsable de producto.
- A/B/C se construyen desde el mismo commit base y bajo las mismas condiciones.
- Desde M3, el commit base es el SHA de `dev` publicado. A/B/C permanecen congeladas mientras los participantes trabajan y solo el equipo despliega los tres PRs aprobados.
- Nunca ejecutes un workflow de fork con secretos. Construye el commit aprobado desde una rama controlada por el repositorio principal.
- El mapeo entre letra, prompt, autor, issue, rama, pull request, commit y URL se registra en GitHub.
- No despliegues una ranura desde un árbol de trabajo con cambios sin commitear.
- A/B/C no promocionan automáticamente una variante a Base.
- Ante un despliegue incorrecto, vuelve a ejecutar el workflow con el último SHA aprobado para esa ranura.

## Skills relacionados

- `superpowers:verification-before-completion`: comprobar build y URL antes de anunciar una publicación.
- `superpowers:systematic-debugging`: investigar fallos de Wrangler o del workflow.
- `architecture-workflow`: cambiar proveedor, cantidad de ranuras o reglas de promoción.
