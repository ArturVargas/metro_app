# Metro App Technical Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el punto de partida común del juego como aplicación Expo web exportable, con un tablero adaptable de ocho estaciones sin interacción.

**Architecture:** Un workspace `pnpm` contiene inicialmente una sola aplicación Expo en `apps/game`; no se crean paquetes vacíos. La pantalla usa primitivas universales de React Native y un único SVG adaptable. El motor de simulación se añadirá cuando una misión introduzca comportamiento que lo necesite.

**Tech Stack:** Node.js 22.21.1, pnpm 8.10.0, Expo, React Native Web, TypeScript, `react-native-svg`, ESLint y GitHub Actions.

**Spec:** [`.ai/references/game/technical-baseline.md`](../../../.ai/references/game/technical-baseline.md)

## Global Constraints

- La primera entrega debe ejecutarse en navegador móvil y de escritorio.
- La aplicación debe conservar compatibilidad con Android e iOS mediante primitivas universales.
- El tablero muestra ocho estaciones fijas y ninguna interacción o mecánica.
- No se agregan router, estado global, motor gráfico, librería de UI, backend, analítica ni observabilidad.
- Las versiones compatibles de Expo y React Native se resuelven con las herramientas de Expo y se fijan en `pnpm-lock.yaml`.
- `.nvmrc` fija Node.js 22.21.1 y el campo `packageManager` fija pnpm 8.10.0.
- Configuración y UI estática reciben verificación proporcional; no se agregan pruebas que solo repitan fixtures o configuración.

## Review Focus

- Un viewport móvil angosto debe conservar las ocho estaciones dentro del tablero sin desplazamiento horizontal.
- Un viewport de escritorio debe mantener el tablero legible sin estirarlo de forma desproporcionada.
- Cada forma debe conservar un nombre accesible aunque no sea interactiva.
- Una instalación limpia debe producir el mismo árbol de dependencias mediante el lockfile.
- La exportación web debe funcionar sin servidor de aplicación ni variables secretas.

---

### Task 1: Workspace y aplicación Expo mínima

**Files:**

- Create: `.nvmrc`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Modify: `.gitignore`
- Create: `pnpm-lock.yaml`
- Create: `apps/game/package.json`
- Create: `apps/game/app.json`
- Create: `apps/game/index.ts`
- Create: `apps/game/tsconfig.json`
- Create: `apps/game/eslint.config.js`
- Create: `apps/game/App.tsx`
- Create: `apps/game/assets/icon.png`
- Create: `apps/game/assets/adaptive-icon.png`
- Create: `apps/game/assets/splash-icon.png`
- Create: `apps/game/assets/favicon.png`

**Interfaces:**

- Consumes: Node.js LTS y `pnpm` instalados localmente.
- Produces: scripts raíz `dev:game`, `lint`, `typecheck` y `build:web`; aplicación `@metro/game` exportable como sitio estático.

- [ ] **Step 1: Crear el workspace y generar `apps/game` desde la plantilla Expo TypeScript vacía**

Configurar `pnpm-workspace.yaml` para `apps/*` y `packages/*`. Mantener únicamente los archivos generados necesarios para una aplicación sin router.

- [ ] **Step 2: Instalar las dependencias web, `react-native-svg` y ESLint mediante Expo**

Usar `expo install` para conservar versiones compatibles. Configurar ESLint con `eslint-config-expo` y excluir `dist/`.

- [ ] **Step 3: Definir los comandos compartidos**

El `package.json` raíz debe delegar en `@metro/game`: desarrollo web, lint, `tsc --noEmit` y `expo export --platform web`.

- [ ] **Step 4: Verificar el scaffold**

Run: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build:web`

Expected: todos los comandos terminan con código 0 y `apps/game/dist/index.html` existe.

- [ ] **Step 5: Commit**

```bash
git add .nvmrc .gitignore package.json pnpm-workspace.yaml pnpm-lock.yaml apps/game
git commit -m "build: scaffold universal game client"
```

### Task 2: Tablero neutral de ocho estaciones

**Files:**

- Modify: `apps/game/App.tsx`
- Create: `apps/game/src/StationBoard.tsx`

**Interfaces:**

- Consumes: `react-native-svg` y el shell Expo creado en Task 1.
- Produces: `StationBoard(): React.JSX.Element`, un tablero estático con ocho estaciones accesibles en coordenadas de `viewBox`.

- [ ] **Step 1: Definir el fixture dentro de `StationBoard.tsx`**

Crear exactamente ocho estaciones con identificador, nombre accesible, forma (`circle`, `triangle` o `square`) y coordenadas normalizadas. Mantener el fixture junto al único componente que lo usa.

- [ ] **Step 2: Renderizar las tres formas con SVG universal**

Usar `Circle`, `Polygon` y `Rect`. Cada estación debe exponer `accessibilityLabel` con el formato `Estación N, <forma>` y permanecer dentro del `viewBox`.

- [ ] **Step 3: Integrar la pantalla neutral**

`App.tsx` debe mostrar el nombre Metro App, una frase breve que indique que es el punto de partida y el tablero. No añadir controles, líneas, trenes, pasajeros ni instrucciones de juego.

- [ ] **Step 4: Verificar código y build**

Run: `pnpm lint && pnpm typecheck && pnpm build:web`

Expected: código 0 en los tres comandos y exportación web actualizada.

- [ ] **Step 5: Verificar visualmente**

Servir `apps/game/dist` y revisar la pantalla completa en `390x844` y `1280x800`. Confirmar ocho estaciones visibles, sin desbordamiento horizontal, solapamientos ni controles interactivos. Guardar capturas y resultados en `.ai/runs/2026-09-27-metro-app-v1/verification.md`.

- [ ] **Step 6: Commit**

```bash
git add apps/game/App.tsx apps/game/src/StationBoard.tsx .ai/runs/2026-09-27-metro-app-v1/verification.md
git commit -m "feat: add neutral station board"
```

### Task 3: Validación continua del cliente

**Files:**

- Create: `.github/workflows/game-checks.yml`
- Modify: `.ai/references/game/technical-baseline.md`
- Modify: `.ai/runs/2026-09-27-metro-app-v1/verification.md`

**Interfaces:**

- Consumes: scripts raíz y lockfile creados en Task 1.
- Produces: validación reproducible de instalación, lint, tipos y exportación web para cada pull request.

- [ ] **Step 1: Crear el workflow de GitHub Actions**

Ejecutar checkout, Node.js LTS, pnpm con la versión fijada, instalación mediante `--frozen-lockfile`, lint, tipos y build web. No desplegar previews todavía.

- [ ] **Step 2: Ejecutar la validación completa local**

Run: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build:web`

Expected: código 0 en todos los comandos.

- [ ] **Step 3: Revisar el alcance**

Confirmar con `git diff` que no existen mecánicas, backend, telemetría, servicio de hosting, paquetes vacíos ni abstracciones para uso futuro. Registrar la decisión de release y la evidencia final en `verification.md`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/game-checks.yml .ai/references/game/technical-baseline.md .ai/runs/2026-09-27-metro-app-v1/verification.md
git commit -m "ci: validate universal game baseline"
```

## Self-review

- **Spec coverage:** los seis elementos aprobados y todas las exclusiones están asignados a Tasks 1–3.
- **Step scan:** cada paso produce un archivo, comando o evidencia verificable; no quedan decisiones técnicas para el ejecutor salvo versiones compatibles resueltas por Expo.
- **Type consistency:** `StationBoard` no expone estado ni contratos que anticipen la simulación.
- **Review Focus:** tamaños móvil y escritorio, accesibilidad, lockfile y exportación estática tienen verificación explícita.
- **Proportion:** el plan no diseña mecánicas ni crea paquetes previstos para trabajo posterior.
