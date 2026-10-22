import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  type LayoutChangeEvent,
  type PointerEvent as RNPointerEvent,
} from "react-native";
import Svg, { Circle, G, Line, Polygon, Rect, Text as SvgText } from "react-native-svg";

// --- Constants & Types ---

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

type Train = {
  id: string;
  lineId: string;
  currentStationIndex: number; // Index in stationIds array
  progress: number; // Distance traveled in current segment (0 to segmentLength)
  direction: 1 | -1; // 1 for forward, -1 for backward
  waitLeft: number; // ms of station stop still pending
};

type EditState = { lineId: string; fromId: string | null };

const VIEW_W = 400;
const VIEW_H = 300;
const VIEW_BOX = `0 0 ${VIEW_W} ${VIEW_H}`;
const STATION_SIZE = 14;
const HIT_R = 22; // 44×44
const STROKE = 8;
const HIT_STROKE = 20;
const MIN_TARGET_PX = 44;
const MAX_LINES = 3;
const TRAIN_MODULE_WIDTH = 14;
const TRAIN_MODULE_HEIGHT = 11;
const TRAIN_MODULE_GAP = 2;

/** Paleta B (sin naranja/rojo de alerta). */
const LINE_COLORS = ["#0072B2", "#009E73", "#CC79A7"] as const;
const TOAST_MS = 2000;
const SELECT_RING = "#555555";
const TRAIN_OUTLINE = "#ffffff";
const TRAIN_SPEED = 50; // Units per second
const STOP_DURATION = 2000; // 2 seconds stop time
const LOCK_MSG = "Pulsa Parar para modificar la red";

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

// --- Utility Functions ---

function lowestFreeNumber(lines: MetroLine[]): number | null {
  const used = new Set(lines.map((l) => l.number));
  for (let n = 1; n <= MAX_LINES; n++) {
    if (!used.has(n)) return n;
  }
  return null;
}

function newTrain(line: MetroLine): Train {
  return {
    id: `T${line.number}`,
    lineId: line.id,
    currentStationIndex: 0,
    progress: 0,
    direction: 1,
    waitLeft: 0,
  };
}

function nextStationIndex(line: MetroLine, index: number, direction: 1 | -1): number {
  const n = line.stationIds.length;
  if (line.closed) return (index + 1) % n;
  const next = index + direction;
  return next < 0 || next >= n ? index - direction : next;
}

function segmentLength(idA: string, idB: string): number {
  const a = STATION_BY_ID[idA];
  const b = STATION_BY_ID[idB];
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Advances a train by `ms` of running time: travel at 50 u/s, 2 s stop at every station. */
function advanceTrain(train: Train, line: MetroLine, ms: number): Train {
  const ids = line.stationIds;
  const n = ids.length;
  let { currentStationIndex, progress, direction, waitLeft } = train;
  let budget = ms;
  for (let guard = 0; budget > 0 && guard < 1000; guard++) {
    if (waitLeft > 0) {
      const used = Math.min(waitLeft, budget);
      waitLeft -= used;
      budget -= used;
      continue;
    }
    const next = nextStationIndex(line, currentStationIndex, direction);
    const length = segmentLength(ids[currentStationIndex], ids[next]);
    const travel = (budget / 1000) * TRAIN_SPEED;
    if (progress + travel < length) {
      progress += travel;
      budget = 0;
    } else {
      budget -= ((length - progress) / TRAIN_SPEED) * 1000;
      currentStationIndex = next;
      progress = 0;
      waitLeft = STOP_DURATION;
      if (!line.closed && (next === 0 || next === n - 1)) {
        direction = next === 0 ? 1 : -1;
      }
    }
  }
  return { ...train, currentStationIndex, progress, direction, waitLeft };
}

function trainPose(train: Train, line: MetroLine): { x: number; y: number; angle: number } {
  const ids = line.stationIds;
  const a = STATION_BY_ID[ids[train.currentStationIndex]];
  const b = STATION_BY_ID[ids[nextStationIndex(line, train.currentStationIndex, train.direction)]];
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const ratio = train.waitLeft > 0 || length === 0 ? 0 : Math.min(1, train.progress / length);
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio,
    angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  };
}

function routePoints(line: MetroLine): Station[] {
  const pts = line.stationIds.map((id) => STATION_BY_ID[id]);
  if (line.closed && pts.length >= 3) pts.push(pts[0]);
  return pts;
}

function distanceToSegment(p: { x: number; y: number }, a: Station, b: Station): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

// --- Component: StationMark ---

function StationMark({
  station,
  selected,
}: {
  station: Station;
  selected: boolean;
}) {
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

// --- Component: TrainVisualization ---

/** T1: {_}, T2: {_}{_}, T3: {_}{_}{_}; centered on (x, y) and rotated with the segment. */
function TrainVisualization({
  lineColor,
  modules,
  x,
  y,
  angle,
}: {
  lineColor: string;
  modules: number;
  x: number;
  y: number;
  angle: number;
}) {
  const total = modules * TRAIN_MODULE_WIDTH + (modules - 1) * TRAIN_MODULE_GAP;
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`} pointerEvents="none">
      {Array.from({ length: modules }, (_, i) => (
        <Rect
          key={i}
          x={-total / 2 + i * (TRAIN_MODULE_WIDTH + TRAIN_MODULE_GAP)}
          y={-TRAIN_MODULE_HEIGHT / 2}
          width={TRAIN_MODULE_WIDTH}
          height={TRAIN_MODULE_HEIGHT}
          rx={2}
          fill={lineColor}
          stroke={TRAIN_OUTLINE}
          strokeWidth={2}
        />
      ))}
    </G>
  );
}

// --- Main Component ---

export function StationBoard(): React.JSX.Element {
  // --- State Management ---
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [trains, setTrains] = useState<Record<string, Train>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guide, setGuide] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [menuLineId, setMenuLineId] = useState<string | null>(null);
  const [chooser, setChooser] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [boardWidth, setBoardWidth] = useState<number | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linesRef = useRef<MetroLine[]>(lines);
  const boardRef = useRef<View>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

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

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setGuide(null);
  }, []);

  // --- Simulation Loop ---

  useEffect(() => {
    if (!isSimRunning) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      const elapsed = last === null ? 0 : now - last;
      last = now;
      if (elapsed > 0) {
        setTrains((prev) => {
          const updated: Record<string, Train> = {};
          for (const [lineId, train] of Object.entries(prev)) {
            const line = linesRef.current.find((l) => l.id === lineId);
            updated[lineId] = line ? advanceTrain(train, line, elapsed) : train;
          }
          return updated;
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isSimRunning]);

  // --- Control Handlers ---

  const hasTrains = Object.keys(trains).length > 0;

  const handleRunPause = useCallback(() => {
    if (!isSimRunning) {
      if (!hasTrains) return;
      clearSelection();
      setMenuLineId(null);
      setChooser(null);
      setEditing(null);
      setIsSimRunning(true);
    } else {
      setIsSimRunning(false);
    }
  }, [isSimRunning, hasTrains, clearSelection]);

  const handleReset = useCallback(() => {
    setIsSimRunning(false);
    setLines([]);
    setTrains({});
    clearSelection();
    setMenuLineId(null);
    setChooser(null);
    setEditing(null);
  }, [clearSelection]);

  // --- Line Creation/Editing Logic ---

  const connect = useCallback(
    (fromId: string, toId: string) => {
      clearSelection();
      const number = lowestFreeNumber(lines);
      if (lines.length >= MAX_LINES || number === null) {
        showToast("Máximo tres líneas");
        return;
      }
      const newLine: MetroLine = {
        id: `line-${number}-${Date.now()}`,
        number,
        color: LINE_COLORS[number - 1],
        stationIds: [fromId, toId],
        createdAt: Date.now(),
        closed: false,
      };
      setLines((prev) => [...prev, newLine]);
      setTrains((prev) => ({ ...prev, [newLine.id]: newTrain(newLine) }));
    },
    [lines, clearSelection, showToast],
  );

  const applyEdit = useCallback(
    (line: MetroLine, stationIds: string[], closed: boolean) => {
      const updated = { ...line, stationIds, closed };
      setLines((prev) => prev.map((l) => (l.id === line.id ? updated : l)));
      setTrains((prev) =>
        prev[line.id] ? { ...prev, [line.id]: newTrain(updated) } : prev,
      );
      setEditing(null);
      setMenuLineId(null);
    },
    [],
  );

  const handleEditStationPress = useCallback(
    (stationId: string) => {
      if (!editing) return;
      const line = lines.find((l) => l.id === editing.lineId);
      if (!line) return;
      const ids = line.stationIds;
      const start = ids[0];
      const end = ids[ids.length - 1];

      if (!editing.fromId) {
        if (stationId === start || stationId === end) {
          setEditing({ ...editing, fromId: stationId });
        } else {
          showToast("Selecciona un extremo");
        }
        return;
      }

      const fromId = editing.fromId;
      if (stationId === fromId) {
        setEditing({ ...editing, fromId: null });
        return;
      }
      const otherEnd = fromId === start ? end : start;
      if (stationId === otherEnd) {
        if (new Set(ids).size < 3) {
          showToast("Se necesitan al menos tres estaciones");
          setEditing({ ...editing, fromId: null });
          return;
        }
        applyEdit(line, ids, true);
        return;
      }
      if (ids.includes(stationId)) {
        showToast("Selecciona un extremo");
        setEditing({ ...editing, fromId: null });
        return;
      }
      applyEdit(line, fromId === start ? [stationId, ...ids] : [...ids, stationId], false);
    },
    [editing, lines, showToast, applyEdit],
  );

  const onStationPress = useCallback(
    (stationId: string) => {
      if (isSimRunning) {
        showToast(LOCK_MSG);
        return;
      }
      if (editing) {
        handleEditStationPress(stationId);
        return;
      }
      setMenuLineId(null);
      setChooser(null);
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
    [isSimRunning, editing, selectedId, clearSelection, connect, handleEditStationPress, showToast],
  );

  const onBackgroundPress = useCallback(() => {
    if (editing) {
      if (editing.fromId) setEditing({ ...editing, fromId: null });
      return;
    }
    if (selectedId) clearSelection();
  }, [editing, selectedId, clearSelection]);

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

  // --- Line Selection ---

  const scale = boardWidth ? boardWidth / VIEW_W : 1;
  const lineHitWidth = Math.max(HIT_STROKE, MIN_TARGET_PX / scale);
  const stationHitR = Math.max(HIT_R, MIN_TARGET_PX / 2 / scale);

  const onBoardPointerDown = useCallback((e: RNPointerEvent) => {
    const node = boardRef.current as unknown as {
      getBoundingClientRect?: () => { left: number; top: number; width: number; height: number };
    } | null;
    if (!node?.getBoundingClientRect) {
      lastPointRef.current = null;
      return;
    }
    const rect = node.getBoundingClientRect();
    const s = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
    lastPointRef.current = {
      x: (e.nativeEvent.clientX - rect.left - (rect.width - VIEW_W * s) / 2) / s,
      y: (e.nativeEvent.clientY - rect.top - (rect.height - VIEW_H * s) / 2) / s,
    };
  }, []);

  const selectLineForMenu = useCallback((lineId: string) => {
    setChooser(null);
    setMenuLineId(lineId);
  }, []);

  const onLinePress = useCallback(
    (lineId: string) => {
      if (isSimRunning) {
        showToast(LOCK_MSG);
        return;
      }
      if (editing) return;
      clearSelection();
      const p = lastPointRef.current;
      const hits = p
        ? lines
            .filter((line) => {
              const pts = routePoints(line);
              for (let i = 0; i < pts.length - 1; i++) {
                if (distanceToSegment(p, pts[i], pts[i + 1]) <= lineHitWidth / 2) return true;
              }
              return false;
            })
            .map((l) => l.id)
        : [];
      if (hits.length > 1) {
        setMenuLineId(null);
        setChooser(hits);
      } else {
        selectLineForMenu(hits[0] ?? lineId);
      }
    },
    [isSimRunning, editing, lines, lineHitWidth, clearSelection, selectLineForMenu, showToast],
  );

  const closeMenus = useCallback(() => {
    setMenuLineId(null);
    setChooser(null);
    setEditing(null);
  }, []);

  const handleMenuAction = useCallback(
    (action: "edit" | "delete" | "retire" | "reassign") => {
      if (isSimRunning) {
        showToast(LOCK_MSG);
        return;
      }
      const line = lines.find((l) => l.id === menuLineId);
      if (!line) return;
      const trainId = `T${line.number}`;

      if (action === "delete") {
        setLines((prev) => prev.filter((l) => l.id !== line.id));
        setTrains((prev) => {
          const next = { ...prev };
          delete next[line.id];
          return next;
        });
        setMenuLineId(null);
      } else if (action === "edit") {
        setEditing({ lineId: line.id, fromId: null });
        setMenuLineId(null);
      } else if (action === "retire") {
        if (!trains[line.id]) return;
        setTrains((prev) => {
          const next = { ...prev };
          delete next[line.id];
          return next;
        });
        showToast(`${trainId} retirado`);
      } else if (action === "reassign") {
        if (trains[line.id]) return;
        setTrains((prev) => (prev[line.id] ? prev : { ...prev, [line.id]: newTrain(line) }));
        showToast(`${trainId} reasignado`);
      }
    },
    [isSimRunning, lines, menuLineId, trains, showToast],
  );

  // --- Derived State & Memoization ---

  const segments = useMemo(() => {
    const out: {
      key: string;
      lineId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
    }[] = [];
    for (const line of lines) {
      const pts = routePoints(line);
      for (let i = 0; i < pts.length - 1; i++) {
        out.push({
          key: `${line.id}-${i}`,
          lineId: line.id,
          x1: pts[i].x,
          y1: pts[i].y,
          x2: pts[i + 1].x,
          y2: pts[i + 1].y,
          color: line.color,
        });
      }
    }
    return out;
  }, [lines]);

  const startLabels = useMemo(() => {
    const perStation: Record<string, number> = {};
    return lines.map((line) => {
      const start = STATION_BY_ID[line.stationIds[0]];
      const slot = perStation[start.id] ?? 0;
      perStation[start.id] = slot + 1;
      return { key: line.id, color: line.color, x: start.x + 22 + slot * 20, y: start.y - 20 };
    });
  }, [lines]);

  const selectedStation = selectedId ? STATION_BY_ID[selectedId] : null;
  const highlightedLineId = editing?.lineId ?? menuLineId;
  const editLine = editing ? lines.find((l) => l.id === editing.lineId) : undefined;
  const menuLine = menuLineId ? lines.find((l) => l.id === menuLineId) : undefined;

  const onBoardLayout = useCallback((e: LayoutChangeEvent) => {
    setBoardWidth(e.nativeEvent.layout.width);
  }, []);

  // --- UI Rendering ---

  const renderLineMenu = () => {
    if (!menuLine) return null;
    const hasTrain = !!trains[menuLine.id];
    return (
      <View style={styles.menuContainer}>
        <Text style={[styles.menuTitle, { color: menuLine.color }]}>Línea {menuLine.number}</Text>
        <View style={styles.menuButtonRow}>
          {menuLine.closed ? null : (
            <TouchableOpacity style={styles.menuButton} onPress={() => handleMenuAction("edit")}>
              <Text style={styles.menuButtonText}>Editar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuButton} onPress={() => handleMenuAction("delete")}>
            <Text style={styles.menuButtonText}>Borrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => handleMenuAction(hasTrain ? "retire" : "reassign")}
          >
            <Text style={styles.menuButtonText}>{hasTrain ? "Retirar tren" : "Reasignar tren"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={closeMenus}>
            <Text style={styles.menuButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEditMenu = () => {
    if (!editLine) return null;
    return (
      <View style={styles.menuContainer}>
        <Text style={[styles.menuTitle, { color: editLine.color }]}>Editar línea {editLine.number}</Text>
        <Text style={styles.menuSubtitle}>
          {editing?.fromId
            ? `Extremo: ${STATION_BY_ID[editing.fromId].name}. Toca una estación nueva o el otro extremo.`
            : "Toca uno de los extremos marcados."}
        </Text>
        <View style={styles.menuButtonRow}>
          <TouchableOpacity style={styles.menuButton} onPress={closeMenus}>
            <Text style={styles.menuButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderChooser = () => {
    if (!chooser) return null;
    return (
      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>¿Qué línea?</Text>
        <View style={styles.menuButtonRow}>
          {chooser.map((id) => {
            const line = lines.find((l) => l.id === id);
            if (!line) return null;
            return (
              <TouchableOpacity key={id} style={styles.menuButton} onPress={() => selectLineForMenu(id)}>
                <View style={styles.chooserRow}>
                  <View style={[styles.swatch, { backgroundColor: line.color }]} />
                  <Text style={styles.menuButtonText}>Línea {line.number}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.menuButton} onPress={closeMenus}>
            <Text style={styles.menuButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- Main Render ---
  return (
    <View style={styles.wrap}>
      {toast ? (
        <Text style={styles.toast} accessibilityLiveRegion="polite">
          {toast}
        </Text>
      ) : (
        <View style={styles.toastPlaceholder} />
      )}

      {/* Board Area */}
      <View
        ref={boardRef}
        style={styles.board}
        onLayout={onBoardLayout}
        onPointerDown={onBoardPointerDown}
        accessibilityLabel="Tablero de estaciones y líneas de metro"
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

          {/* Hit areas for line selection */}
          {segments.map((seg) => (
            <Line
              key={`hit-${seg.key}`}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="transparent"
              strokeWidth={lineHitWidth}
              strokeLinecap="round"
              onPress={() => onLinePress(seg.lineId)}
              accessibilityLabel="Seleccionar línea"
            />
          ))}

          {segments.map((seg) =>
            seg.lineId === highlightedLineId ? (
              <Line
                key={`halo-${seg.key}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={SELECT_RING}
                strokeWidth={STROKE + 8}
                strokeLinecap="round"
                opacity={0.45}
                pointerEvents="none"
              />
            ) : null,
          )}

          {segments.map((seg) => (
            <Line
              key={`line-${seg.key}`}
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

          {/* Rubber Band Guide (Web Only) */}
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

          {/* Stations */}
          {STATIONS.map((station) => (
            <StationMark
              key={station.id}
              station={station}
              selected={station.id === selectedId || station.id === editing?.fromId}
            />
          ))}

          {/* Endpoints of the line being edited */}
          {editLine && !editLine.closed
            ? [editLine.stationIds[0], editLine.stationIds[editLine.stationIds.length - 1]].map((id) => (
                <Circle
                  key={`end-${id}`}
                  cx={STATION_BY_ID[id].x}
                  cy={STATION_BY_ID[id].y}
                  r={STATION_SIZE + 11}
                  fill="none"
                  stroke={editLine.color}
                  strokeWidth={3}
                  strokeDasharray="5 4"
                  pointerEvents="none"
                />
              ))
            : null}

          {/* Start labels "1" */}
          {startLabels.map((label) => (
            <G key={`label-${label.key}`} pointerEvents="none">
              <Circle cx={label.x} cy={label.y} r={9} fill="#ffffff" stroke={label.color} strokeWidth={2} />
              <SvgText
                x={label.x}
                y={label.y + 4.5}
                fontSize={13}
                fontWeight="bold"
                fill={label.color}
                textAnchor="middle"
              >
                1
              </SvgText>
            </G>
          ))}

          {/* Train Visualization (Dynamic) */}
          {Object.values(trains).map((train) => {
            const line = lines.find((l) => l.id === train.lineId);
            if (!line) return null;
            const pose = trainPose(train, line);
            return (
              <TrainVisualization
                key={train.id}
                lineColor={line.color}
                modules={line.number}
                x={pose.x}
                y={pose.y}
                angle={pose.angle}
              />
            );
          })}

          {/* Hit Areas for Station Selection */}
          {STATIONS.map((station) => (
            <Circle
              key={`hit-${station.id}`}
              cx={station.x}
              cy={station.y}
              r={stationHitR}
              fill="transparent"
              onPress={() => onStationPress(station.id)}
              accessibilityLabel={`${station.name}, ${SHAPE_LABEL[station.shape]}`}
            />
          ))}
        </Svg>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlButton, !isSimRunning && !hasTrains ? styles.buttonDisabled : null]}
            onPress={handleRunPause}
            disabled={!isSimRunning && !hasTrains}
            accessibilityRole="button"
          >
            <Text style={styles.controlButtonText}>{isSimRunning ? "Parar" : "Ejecutar"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleReset} accessibilityRole="button">
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {renderChooser()}
        {renderLineMenu()}
        {renderEditMenu()}
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 12,
    paddingBottom: 20,
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
  controlPanel: {
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 600,
    gap: 12,
  },
  controlButton: {
    backgroundColor: "#3b82f6",
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  controlButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  menuContainer: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    width: "100%",
    alignItems: "center",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1f2937",
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 8,
    textAlign: "center",
  },
  menuButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  menuButton: {
    backgroundColor: "#e0e7ff",
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexGrow: 1,
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  menuButtonText: {
    color: "#3730a3",
    fontWeight: "600",
    fontSize: 14,
  },
  chooserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
