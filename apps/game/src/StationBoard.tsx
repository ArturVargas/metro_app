import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";

type StationShape = "circle" | "triangle" | "square";

type Station = {
  id: string;
  name: string;
  shape: StationShape;
  x: number;
  y: number;
};

type MetroLine = {
  id: string;
  number: number;
  color: string;
  stationIds: string[];
  createdAt: number;
  closed: boolean;
};

// --- Train State ---
type TrainState = {
  lineId: string;
  // Index in stationIds of the station the current leg starts from
  at: number;
  // Open lines only: 1 = toward the last station, -1 = back to the first
  direction: 1 | -1;
  dist: number;
  // Detenido while > 0 (ms left of the station stop)
  waitLeft: number;
};

type Sim = {
  trains: Record<string, TrainState>;
  glow: Record<string, number>;
};

const VIEW_W = 400;
const VIEW_H = 300;
const VIEW_BOX = `0 0 ${VIEW_W} ${VIEW_H}`;
const STATION_SIZE = 14;
const HIT_R = 22; // 44×44
const STROKE = 8;
const HIT_STROKE = 20;
const MAX_LINES = 3;
/** Paleta B (sin naranja/rojo de alerta). */
const LINE_COLORS = ["#0072B2", "#009E73", "#CC79A7"] as const;
const TOAST_MS = 2000;
const SELECT_RING = "#555555";

// Simulation Constants
const TRAIN_SPEED_PX_PER_SECOND = 50; // Fixed speed
const STOP_DURATION_MS = 2000; // 2 seconds stop
const LIGHT_FADE_DURATION_MS = 800; // 0.8 seconds fade
const GLOW_COLOR = "#39FF14";

const SHAPE_LABEL: Record<StationShape, string> = {
  circle: "círculo",
  triangle: "triángulo",
  square: "cuadrado",
};

/** Fixture de ocho estaciones fijas del baseline. */
const STATIONS: Station[] = [
  { id: "1", name: "Estación 1", shape: "circle", x: 60, y: 70 },
  { id: "2", name: "Estación 2", shape: "triangle", x: 180, y: 45 },
  { id: "3", name: "Estación 3", shape: "square", x: 320, y: 65 },
  { id: "4", name: "Estación 4", shape: "circle", x: 110, y: 140 },
  { id: "5", name: "Estación 5", shape: "square", x: 240, y: 130 },
  { id: "6", name: "Estación 6", shape: "triangle", x: 340, y: 160 },
  { id: "7", name: "Estación 7", shape: "square", x: 70, y: 230 },
  { id: "8", name: "Estación 8", shape: "circle", x: 220, y: 240 },
];

const STATION_BY_ID: Record<string, Station> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s]),
);

const webTestId = (id: string): object =>
  Platform.OS === "web" ? { "data-testid": id } : { testID: id };

// --- Utility Functions ---

function endpointsOf(line: MetroLine): [string, string] {
  const ids = line.stationIds;
  return [ids[0], ids[ids.length - 1]];
}

function linesWithEndpoint(lines: MetroLine[], stationId: string): MetroLine[] {
  return lines.filter((l) => {
    if (l.closed) return false;
    const [a, b] = endpointsOf(l);
    return a === stationId || b === stationId;
  });
}

function firstFreeColor(lines: MetroLine[]): string | null {
  const used = new Set(lines.map((l) => l.color));
  for (const c of LINE_COLORS) {
    if (!used.has(c)) return c;
  }
  return null;
}

function newTrain(lineId: string): TrainState {
  return { lineId, at: 0, direction: 1, dist: 0, waitLeft: 0 };
}

function nextIndex(line: MetroLine, t: TrainState): number {
  const n = line.stationIds.length;
  return line.closed ? (t.at + 1) % n : t.at + t.direction;
}

function legLength(line: MetroLine, from: number, to: number): number {
  const a = STATION_BY_ID[line.stationIds[from]];
  const b = STATION_BY_ID[line.stationIds[to]];
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Moves a train by dtMs of real time: 50 u/s, 2 s stop at every station. */
function advanceTrain(t: TrainState, line: MetroLine, dtMs: number): TrainState {
  const n = line.stationIds.length;
  let { at, direction, dist, waitLeft } = t;
  let budget = dtMs;
  for (let guard = 0; budget > 0 && guard < 1000; guard++) {
    if (waitLeft > 0) {
      const used = Math.min(waitLeft, budget);
      waitLeft -= used;
      budget -= used;
      continue;
    }
    const to = nextIndex(line, { ...t, at, direction });
    const len = legLength(line, at, to);
    const need = ((len - dist) / TRAIN_SPEED_PX_PER_SECOND) * 1000;
    if (budget < need) {
      dist += (budget * TRAIN_SPEED_PX_PER_SECOND) / 1000;
      budget = 0;
    } else {
      budget -= need;
      at = to;
      dist = 0;
      waitLeft = STOP_DURATION_MS;
      if (!line.closed && at === n - 1) direction = -1;
      if (!line.closed && at === 0) direction = 1;
    }
  }
  return { ...t, at, direction, dist, waitLeft };
}

function trainPosition(t: TrainState, line: MetroLine): { x: number; y: number } {
  const a = STATION_BY_ID[line.stationIds[t.at]];
  if (t.waitLeft > 0 || t.dist === 0) return { x: a.x, y: a.y };
  const b = STATION_BY_ID[line.stationIds[nextIndex(line, t)]];
  const k = Math.min(1, t.dist / legLength(line, t.at, nextIndex(line, t)));
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}

function stepSim(prev: Sim, lines: MetroLine[], dtMs: number): Sim {
  const trains: Record<string, TrainState> = {};
  const occupied = new Set<string>();
  for (const line of lines) {
    const t = prev.trains[line.id];
    if (!t) continue;
    const moved = advanceTrain(t, line, dtMs);
    trains[line.id] = moved;
    const p = trainPosition(moved, line);
    for (const s of STATIONS) {
      if (Math.hypot(s.x - p.x, s.y - p.y) <= STATION_SIZE) occupied.add(s.id);
    }
  }
  const glow: Record<string, number> = {};
  for (const s of STATIONS) {
    const level = occupied.has(s.id)
      ? 1
      : (prev.glow[s.id] ?? 0) - dtMs / LIGHT_FADE_DURATION_MS;
    if (level > 0) glow[s.id] = level;
  }
  return { trains, glow };
}

// --- Components ---

function TrainMark({ line, train }: { line: MetroLine; train: TrainState }) {
  const { x, y } = trainPosition(train, line);
  const label = `T${line.number}`;
  const state = train.waitLeft > 0 ? "Detenido" : "En movimiento";
  return (
    <G
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
      pointerEvents="none"
      accessibilityLabel={`${label}, ${state}`}
      {...webTestId(`train-${label}`)}
    >
      <Rect
        x={-15}
        y={-10}
        width={30}
        height={20}
        rx={5}
        fill={line.color}
        stroke="#ffffff"
        strokeWidth={2}
      />
      <SvgText
        x={0}
        y={4}
        fontSize={11}
        fontWeight="700"
        fill="#ffffff"
        textAnchor="middle"
        pointerEvents="none"
      >
        {label}
      </SvgText>
    </G>
  );
}

/**
 * Versión C — fusión A+B:
 * anillo gris #555555, paleta B, tap-tap + rubber-band desktop,
 * stroke 8px, hit 44×44, toast 2s, circuitos (A), borrar tramo (B).
 */
export function StationBoard(): React.JSX.Element {
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guide, setGuide] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Train State Management ---
  const [sim, setSim] = useState<Sim>({ trains: {}, glow: {} });

  // --- Toast Management ---
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  // --- Line Management ---
  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setGuide(null);
  }, []);

  const removeTrain = useCallback((lineId: string) => {
    setSim((prev) => {
      const trains = { ...prev.trains };
      delete trains[lineId];
      return { ...prev, trains };
    });
  }, []);

  const deleteLine = useCallback(
    (line: MetroLine) => {
      setLines((prev) => prev.filter((l) => l.id !== line.id));
      removeTrain(line.id);
      clearSelection();
      showToast(`Línea ${line.number} eliminada`);
    },
    [clearSelection, removeTrain, showToast],
  );

  const connect = useCallback(
    (fromId: string, toId: string) => {
      clearSelection();
      if (fromId === toId) return;

      const candidates = linesWithEndpoint(lines, fromId).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
      const extendTarget = candidates[0];

      if (extendTarget) {
        const ids = [...extendTarget.stationIds];
        const atStart = ids[0] === fromId;
        const otherEnd = atStart ? ids[ids.length - 1] : ids[0];
        let changed: MetroLine | null = null;

        // Circuitos (de A): cerrar si ≥3 estaciones.
        if (toId === otherEnd && ids.length >= 3) {
          changed = { ...extendTarget, closed: true };
        } else if (!ids.includes(toId)) {
          const nextIds = atStart ? [toId, ...ids] : [...ids, toId];
          changed = { ...extendTarget, stationIds: nextIds };
        }
        if (!changed) return;
        const updated = changed;
        setLines((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        setSim((prev) =>
          prev.trains[updated.id]
            ? { ...prev, trains: { ...prev.trains, [updated.id]: newTrain(updated.id) } }
            : prev,
        );
        return;
      }

      const color = lines.length < MAX_LINES ? firstFreeColor(lines) : null;
      if (!color) {
        showToast("Máximo 3 líneas");
        return;
      }
      const now = Date.now();
      setLines((prev) => [
        ...prev,
        {
          id: `line-${now}-${prev.length}`,
          number: LINE_COLORS.indexOf(color as (typeof LINE_COLORS)[number]) + 1,
          color,
          stationIds: [fromId, toId],
          createdAt: now,
          closed: false,
        },
      ]);
    },
    [lines, clearSelection, showToast],
  );

  // --- Train Control Handlers ---
  const assignTrain = useCallback(
    (line: MetroLine) => {
      setSim((prev) =>
        prev.trains[line.id]
          ? prev
          : { ...prev, trains: { ...prev.trains, [line.id]: newTrain(line.id) } },
      );
      showToast(`T${line.number} asignado a Línea ${line.number}`);
    },
    [showToast],
  );

  const retireTrain = useCallback(
    (line: MetroLine) => {
      removeTrain(line.id);
      showToast(`T${line.number} retirado`);
    },
    [removeTrain, showToast],
  );

  // --- Simulation Loop ---
  const running =
    Object.keys(sim.trains).length > 0 || Object.keys(sim.glow).length > 0;
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.max(0, now - last);
      last = now;
      setSim((prev) => stepSim(prev, lines, dt));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, lines]);

  // --- Interaction Handlers ---

  const onStationPress = useCallback(
    (stationId: string) => {
      if (!selectedId) {
        setSelectedId(stationId);
        const s = STATION_BY_ID[stationId];
        setGuide({ x: s.x, y: s.y });
        return;
      }
      if (selectedId === stationId) {
        clearSelection();
        return;
      }
      connect(selectedId, stationId);
    },
    [selectedId, clearSelection, connect],
  );

  const onBackgroundPress = useCallback(() => {
    if (selectedId) clearSelection();
  }, [selectedId, clearSelection]);

  // Rubber-band solo en desktop/web (mouse).
  useEffect(() => {
    if (Platform.OS !== "web" || !selectedId) return;
    const handler = (ev: MouseEvent) => {
      const el = document.querySelector(
        '[data-metro-board="c"]',
      ) as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
      const offsetX = (rect.width - VIEW_W * scale) / 2;
      const offsetY = (rect.height - VIEW_H * scale) / 2;
      setGuide({
        x: (ev.clientX - rect.left - offsetX) / scale,
        y: (ev.clientY - rect.top - offsetY) / scale,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [selectedId]);

  // --- Memoized Calculations ---

  const segments = useMemo(() => {
    const out: {
      key: string;
      line: MetroLine;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
    }[] = [];
    for (const line of lines) {
      const ids = line.stationIds;
      for (let i = 0; i < ids.length - 1; i++) {
        const a = STATION_BY_ID[ids[i]];
        const b = STATION_BY_ID[ids[i + 1]];
        out.push({
          key: `${line.id}-${i}`,
          line,
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          color: line.color,
        });
      }
      if (line.closed && ids.length >= 3) {
        const a = STATION_BY_ID[ids[ids.length - 1]];
        const b = STATION_BY_ID[ids[0]];
        out.push({
          key: `${line.id}-close`,
          line,
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          color: line.color,
        });
      }
    }
    return out;
  }, [lines]);

  const selectedStation = selectedId ? STATION_BY_ID[selectedId] : null;
  const panelLines = [...lines].sort((a, b) => a.number - b.number);

  return (
    <View style={styles.wrap}>
      {/* Toast Message */}
      {toast ? (
        <Text style={styles.toast} accessibilityLiveRegion="polite">
          {toast}
        </Text>
      ) : (
        <View style={styles.toastPlaceholder} />
      )}

      {/* Metro Board */}
      <View
        style={styles.board}
        accessibilityLabel="Tablero de estaciones"
        {...(Platform.OS === "web"
          ? ({ "data-metro-board": "c" } as object)
          : {})}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={VIEW_BOX}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background Grid */}
          <Rect
            x={0}
            y={0}
            width={VIEW_W}
            height={VIEW_H}
            fill="#f4f6f8"
            stroke="#d0d7de"
            strokeWidth={2}
            onPress={onBackgroundPress}
          />

          {/* Line Segments (Clickable for deletion) */}
          {segments.map((seg) => (
            <Line
              key={`hit-${seg.key}`}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="transparent"
              strokeWidth={HIT_STROKE}
              strokeLinecap="round"
              onPress={() => deleteLine(seg.line)}
              accessibilityLabel={`Eliminar Línea ${seg.line.number}`}
            />
          ))}

          {/* Line Paths (Visual) */}
          {segments.map((seg) => (
            <Line
              key={seg.key}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              pointerEvents="none"
            />
          ))}

          {/* Selection Guide (Web only) */}
          {selectedStation && guide && Platform.OS === "web" ? (
            <Line
              x1={selectedStation.x}
              y1={selectedStation.y}
              x2={guide.x}
              y2={guide.y}
              stroke={SELECT_RING}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray="8 6"
              opacity={0.7}
              pointerEvents="none"
            />
          ) : null}

          {/* Station glow (train stopped or passing) */}
          {STATIONS.filter((s) => sim.glow[s.id]).map((s) => (
            <Circle
              key={`glow-${s.id}`}
              cx={s.x}
              cy={s.y}
              r={STATION_SIZE + 7}
              fill={GLOW_COLOR}
              opacity={sim.glow[s.id]}
              pointerEvents="none"
              {...webTestId(`glow-${s.id}`)}
            />
          ))}

          {/* Stations */}
          {STATIONS.map((station) => (
            <StationMark
              key={station.id}
              station={station}
              selected={station.id === selectedId}
            />
          ))}

          {/* Train hit areas (tap retires); station hits stay on top */}
          {lines.map((line) => {
            const t = sim.trains[line.id];
            if (!t) return null;
            const { x, y } = trainPosition(t, line);
            return (
              <Rect
                key={`train-hit-${line.id}`}
                x={x - 22}
                y={y - 22}
                width={44}
                height={44}
                fill="transparent"
                onPress={() => retireTrain(line)}
                accessibilityLabel={`Retirar T${line.number}`}
                {...webTestId(`train-hit-T${line.number}`)}
              />
            );
          })}

          {/* Hit Areas (Clickable) */}
          {STATIONS.map((station) => (
            <Circle
              key={`hit-${station.id}`}
              cx={station.x}
              cy={station.y}
              r={HIT_R}
              fill="transparent"
              onPress={() => onStationPress(station.id)}
              accessibilityLabel={`${station.name}, ${SHAPE_LABEL[station.shape]}`}
            />
          ))}

          {/* Trains (visual only) */}
          {lines.map((line) =>
            sim.trains[line.id] ? (
              <TrainMark
                key={`train-${line.id}`}
                line={line}
                train={sim.trains[line.id]}
              />
            ) : null,
          )}
        </Svg>
      </View>

      {/* Train Panel */}
      <View style={styles.trainPanel}>
        <Text style={styles.panelTitle} accessibilityRole="header">
          Trenes
        </Text>
        <View style={styles.trainList}>
          {panelLines.map((line) => {
            const hasTrain = Boolean(sim.trains[line.id]);
            return (
              <View
                key={line.id}
                style={styles.trainContainer}
                testID={`row-line-${line.number}`}
              >
                <View style={[styles.swatch, { backgroundColor: line.color }]} />
                <Text style={styles.trainLabel}>
                  {`Línea ${line.number} · ${hasTrain ? `Con T${line.number}` : "Sin tren"}`}
                </Text>
                <Pressable
                  onPress={() => (hasTrain ? retireTrain(line) : assignTrain(line))}
                  style={styles.button}
                  accessibilityRole="button"
                  testID={`btn-train-line-${line.number}`}
                >
                  <Text style={styles.buttonText}>
                    {hasTrain ? "Retirar tren" : "Asignar tren"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// --- StationMark Component (Kept mostly the same) ---
interface StationMarkProps {
  station: Station;
  selected: boolean;
}

function StationMark({
  station,
  selected,
}: StationMarkProps) {
  const label = `${station.name}, ${SHAPE_LABEL[station.shape]}`;
  const common = {
    accessibilityLabel: label,
    accessible: true as const,
    fill: "#1a1a1a",
  };
  const ring = selected ? (
    <Circle
      cx={station.x}
      cy={station.y}
      r={STATION_SIZE + 6}
      fill="none"
      stroke={SELECT_RING}
      strokeWidth={3}
      pointerEvents="none"
    />
  ) : null;

  switch (station.shape) {
    case "circle":
      return (
        <>
          {ring}
          <Circle cx={station.x} cy={station.y} r={STATION_SIZE} {...common} />
        </>
      );
    case "triangle": {
      const h = STATION_SIZE * 1.8;
      const half = h / Math.sqrt(3);
      const points = [
        `${station.x},${station.y - h * 0.6}`,
        `${station.x - half},${station.y + h * 0.4}`,
        `${station.x + half},${station.y + h * 0.4}`,
      ].join(" ");
      return (
        <>
          {ring}
          <Polygon points={points} {...common} />
        </>
      );
    }
    case "square":
      return (
        <>
          {ring}
          <Rect
            x={station.x - STATION_SIZE}
            y={station.y - STATION_SIZE}
            width={STATION_SIZE * 2}
            height={STATION_SIZE * 2}
            {...common}
          />
        </>
      );
  }
}

// --- Styles ---
const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 20,
  },
  toast: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    minHeight: 20,
  },
  toastPlaceholder: {
    minHeight: 20,
  },
  board: {
    width: "100%",
    aspectRatio: VIEW_W / VIEW_H,
  },

  // Train Panel Styles
  trainPanel: {
    width: "100%",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1f2937",
  },
  trainList: {
    gap: 10,
  },
  trainContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    marginLeft: "auto",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  trainLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
  },
});
