import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type PointerEvent as RNPointerEvent,
} from "react-native";
import Svg, { Circle, Line, Polygon, Rect } from "react-native-svg";

// --- Constants and Types ---

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
  color: string;
  stationIds: string[];
  createdAt: number;
  closed: boolean;
};

// Train State
type Train = {
  id: number;
  lineId: string | null;
  routeKey: string;
  distance: number;
  direction: 1 | -1;
};

type Point = { x: number; y: number };

type BoardRect = { left: number; top: number; width: number; height: number };

type DragState = {
  trainId: number;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
  hoverLineIds: string[];
};

const VIEW_W = 400;
const VIEW_H = 300;
const VIEW_BOX = `0 0 ${VIEW_W} ${VIEW_H}`;
const STATION_SIZE = 14;
const HIT_R = 22; // 44×44
const STROKE = 8;
const HIT_STROKE = 20;
const MAX_LINES = 3;
const NUM_TRAINS = 4;
const TRAIN_SPEED = 100;
const MAX_FRAME_S = 0.1;
const DRAG_THRESHOLD_PX = 8;
const DROP_ZONE_PX = 22;
const DEPOT_GREY = "#9ca3af";
const NOTICE_GREY = "#374151";
const LINE_BUSY_MSG = "Esa línea ya tiene tren";

/** Paleta B (sin naranja/rojo de alerta). */
const LINE_COLORS = ["#0072B2", "#009E73", "#CC79A7"] as const;
const COLOR_NAME: Record<string, string> = {
  "#0072B2": "azul",
  "#009E73": "verde",
  "#CC79A7": "rosa",
};
const TOAST_MS = 2000;
const SELECT_RING = "#555555";

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

const INITIAL_TRAINS: Train[] = Array.from({ length: NUM_TRAINS }, (_, i) => ({
  id: i + 1,
  lineId: null,
  routeKey: "",
  distance: 0,
  direction: 1,
}));

// --- Utility Functions ---

/** Gets the two endpoints of a line. */
function endpointsOf(line: MetroLine): [string, string] {
  const ids = line.stationIds;
  return [ids[0], ids[ids.length - 1]];
}

/** Filters lines that use the given station ID as an endpoint. */
function linesWithEndpoint(lines: MetroLine[], stationId: string): MetroLine[] {
  return lines.filter((l) => {
    if (l.closed) return false;
    const [a, b] = endpointsOf(l);
    return a === stationId || b === stationId;
  });
}

/** Finds the next available color for a new line. */
function firstFreeColor(lines: MetroLine[]): string | null {
  const used = new Set(lines.map((l) => l.color));
  for (const c of LINE_COLORS) {
    if (!used.has(c)) return c;
  }
  return null;
}

function routeKeyOf(line: MetroLine): string {
  return `${line.stationIds.join(">")}|${line.closed ? "c" : "o"}`;
}

function routeOf(line: MetroLine): Point[] {
  const pts: Point[] = line.stationIds.map((id) => STATION_BY_ID[id]);
  if (line.closed && pts.length >= 3) pts.push(pts[0]);
  return pts;
}

function routeLength(pts: Point[]): number {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
  }
  return total;
}

function pointOnRoute(pts: Point[], distance: number): Point & { angle: number } {
  let left = distance;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= len || i === pts.length - 2) {
      const t = len === 0 ? 0 : Math.min(1, Math.max(0, left / len));
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    left -= len;
  }
  return { x: pts[0].x, y: pts[0].y, angle: 0 };
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

function freeTrain(t: Train): Train {
  return { ...t, lineId: null, routeKey: "", distance: 0, direction: 1 };
}

function advanceTrain(train: Train, line: MetroLine, dt: number): Train {
  const key = routeKeyOf(line);
  if (key !== train.routeKey) {
    return { ...train, routeKey: key, distance: 0, direction: 1 };
  }
  const total = routeLength(routeOf(line));
  if (total === 0 || dt === 0) return train;
  let distance = train.distance + train.direction * TRAIN_SPEED * dt;
  let direction = train.direction;
  if (line.closed) {
    distance = ((distance % total) + total) % total;
  } else {
    while (distance > total || distance < 0) {
      if (distance > total) {
        distance = 2 * total - distance;
        direction = -1;
      } else {
        distance = -distance;
        direction = 1;
      }
    }
  }
  return { ...train, distance, direction };
}

function boardScale(width: number, height: number) {
  const scale = Math.min(width / VIEW_W, height / VIEW_H);
  return {
    scale,
    offsetX: (width - VIEW_W * scale) / 2,
    offsetY: (height - VIEW_H * scale) / 2,
  };
}

// --- StationMark Component ---
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

// --- Train Visualization Component ---
function TrainVisual({
  trainId,
  color,
  angle,
}: {
  trainId: number;
  color: string;
  angle: number;
}) {
  return (
    <View style={[styles.trainVisual, { borderColor: color }]}>
      <Text style={styles.trainNumber}>{trainId}</Text>
      <Text style={[styles.trainArrow, { transform: [{ rotate: `${angle}deg` }] }]}>→</Text>
    </View>
  );
}

const WEB_NO_TOUCH_SCROLL = (Platform.OS === "web" ? { touchAction: "none" } : {}) as object;

// --- Train Depot Component ---
interface TrainDepotProps {
  trains: Train[];
  linesById: Record<string, MetroLine>;
  draggingId: number | null;
  onPointerDown: (trainId: number, e: RNPointerEvent) => void;
  onPointerMove: (e: RNPointerEvent) => void;
  onPointerUp: (e: RNPointerEvent) => void;
  onPointerCancel: (e: RNPointerEvent) => void;
  onRemoveTrain: (trainId: number) => void;
}

function TrainDepot({
  trains,
  linesById,
  draggingId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onRemoveTrain,
}: TrainDepotProps) {
  const inServiceCount = trains.filter((t) => t.lineId && linesById[t.lineId]).length;
  const depotCount = trains.length - inServiceCount;

  return (
    <View style={styles.depotContainer}>
      <Text style={styles.depotStatus}>
        En la cochera: {depotCount} · En servicio: {inServiceCount}
      </Text>
      <View style={styles.trainSlots}>
        {trains.map((train) => {
          const line = train.lineId ? linesById[train.lineId] : undefined;
          const isDragging = draggingId === train.id;
          return (
            <View
              key={train.id}
              style={[styles.slot, isDragging && styles.slotDragging]}
            >
              <Text style={styles.slotNumber}>{train.id}</Text>
              {line ? (
                <>
                  <View style={styles.slotLine}>
                    <View style={[styles.slotDot, { backgroundColor: line.color }]} />
                    <Text style={styles.slotLineText}>Línea {COLOR_NAME[line.color]}</Text>
                  </View>
                  <Pressable
                    onPress={() => onRemoveTrain(train.id)}
                    style={styles.removeButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Retirar tren ${train.id}`}
                  >
                    <Text style={styles.removeButtonText}>Retirar</Text>
                  </Pressable>
                </>
              ) : (
                <View
                  style={[styles.dragHandle, WEB_NO_TOUCH_SCROLL]}
                  accessibilityLabel={`Tren ${train.id} en la cochera`}
                  onPointerDown={(e) => onPointerDown(train.id, e)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel}
                >
                  {isDragging ? null : (
                    <TrainVisual trainId={train.id} color={DEPOT_GREY} angle={0} />
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// --- Main Component ---

export function StationBoard(): React.JSX.Element {
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guide, setGuide] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Train State Management
  const [trains, setTrains] = useState<Train[]>(INITIAL_TRAINS);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [boardSize, setBoardSize] = useState<{ width: number; height: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const boardRef = useRef<View>(null);
  const boardRectRef = useRef<BoardRect | null>(null);
  const linesRef = useRef<MetroLine[]>(lines);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

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

  // --- Line Connection Logic ---
  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setGuide(null);
  }, []);

  const deleteLine = useCallback(
    (lineId: string) => {
      setLines((prev) => prev.filter((l) => l.id !== lineId));
      setTrains((prev) => prev.map((t) => (t.lineId === lineId ? freeTrain(t) : t)));
      clearSelection();
    },
    [clearSelection],
  );

  const connect = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) {
        clearSelection();
        return;
      }

      setLines((prev) => {
        const candidates = linesWithEndpoint(prev, fromId).sort(
          (a, b) => b.createdAt - a.createdAt,
        );
        const extendTarget = candidates[0];

        if (extendTarget) {
          const ids = [...extendTarget.stationIds];
          const atStart = ids[0] === fromId;
          const otherEnd = atStart ? ids[ids.length - 1] : ids[0];

          // Circuitos (de A): cerrar si ≥3 estaciones.
          if (toId === otherEnd && ids.length >= 3) {
            return prev.map((l) =>
              l.id === extendTarget.id ? { ...l, closed: true } : l,
            );
          }

          if (ids.includes(toId)) {
            return prev;
          }

          const nextIds = atStart ? [toId, ...ids] : [...ids, toId];
          return prev.map((l) =>
            l.id === extendTarget.id ? { ...l, stationIds: nextIds } : l,
          );
        }

        if (prev.length >= MAX_LINES) {
          showToast("Máximo 3 líneas");
          return prev;
        }
        const color = firstFreeColor(prev);
        if (!color) {
          showToast("Máximo 3 líneas");
          return prev;
        }
        return [
          ...prev,
          {
            id: `line-${Date.now()}-${prev.length}`,
            color,
            stationIds: [fromId, toId],
            createdAt: Date.now(),
            closed: false,
          },
        ];
      });

      clearSelection();
    },
    [clearSelection, showToast],
  );

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

  // --- Train Management ---

  /** Handles removing a train from a line. */
  const handleRemoveTrain = useCallback((trainId: number) => {
    setTrains((prev) => prev.map((t) => (t.id === trainId ? freeTrain(t) : t)));
  }, []);

  const handleAssignTrain = useCallback(
    (trainId: number, targetLineId: string) => {
      const line = linesRef.current.find((l) => l.id === targetLineId);
      if (!line) return;
      if (trains.some((t) => t.lineId === targetLineId)) {
        showToast(LINE_BUSY_MSG);
        return;
      }
      setTrains((prev) =>
        prev.map((t) =>
          t.id === trainId && !t.lineId
            ? { ...t, lineId: targetLineId, routeKey: routeKeyOf(line), distance: 0, direction: 1 }
            : t,
        ),
      );
    },
    [trains, showToast],
  );

  // --- Drag from the depot ---

  const measureBoard = useCallback(() => {
    const node = boardRef.current as unknown as {
      getBoundingClientRect?: () => BoardRect;
    } | null;
    if (node?.getBoundingClientRect) {
      const r = node.getBoundingClientRect();
      boardRectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
      return;
    }
    boardRef.current?.measureInWindow((x, y, width, height) => {
      boardRectRef.current = { left: x, top: y, width, height };
    });
  }, []);

  const linesAtPoint = useCallback((clientX: number, clientY: number): MetroLine[] => {
    const rect = boardRectRef.current;
    if (!rect) return [];
    const { scale, offsetX, offsetY } = boardScale(rect.width, rect.height);
    if (scale <= 0) return [];
    const p = {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
    const zone = DROP_ZONE_PX / scale;
    return linesRef.current
      .filter((line) => {
        const pts = routeOf(line);
        for (let i = 0; i < pts.length - 1; i++) {
          if (distanceToSegment(p, pts[i], pts[i + 1]) <= zone) return true;
        }
        return false;
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDrag(null);
  }, []);

  const onDepotPointerDown = useCallback(
    (trainId: number, e: RNPointerEvent) => {
      const ev = e.nativeEvent;
      if (dragRef.current) return;
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      const target = e.currentTarget as unknown as {
        setPointerCapture?: (id: number) => void;
      };
      target.setPointerCapture?.(ev.pointerId);
      measureBoard();
      const next: DragState = {
        trainId,
        pointerId: ev.pointerId,
        startX: ev.clientX,
        startY: ev.clientY,
        x: ev.clientX,
        y: ev.clientY,
        active: false,
        hoverLineIds: [],
      };
      dragRef.current = next;
      setDrag(next);
    },
    [measureBoard],
  );

  const onDepotPointerMove = useCallback(
    (e: RNPointerEvent) => {
      const ev = e.nativeEvent;
      const d = dragRef.current;
      if (!d || ev.pointerId !== d.pointerId) return;
      const moved = Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY);
      if (!d.active && moved <= DRAG_THRESHOLD_PX) return;
      if (
        Platform.OS === "web" &&
        (ev.clientX < 0 || ev.clientY < 0 || ev.clientX > window.innerWidth || ev.clientY > window.innerHeight)
      ) {
        endDrag();
        return;
      }
      const next: DragState = {
        ...d,
        active: true,
        x: ev.clientX,
        y: ev.clientY,
        hoverLineIds: linesAtPoint(ev.clientX, ev.clientY).map((l) => l.id),
      };
      dragRef.current = next;
      setDrag(next);
    },
    [endDrag, linesAtPoint],
  );

  const onDepotPointerUp = useCallback(
    (e: RNPointerEvent) => {
      const ev = e.nativeEvent;
      const d = dragRef.current;
      if (!d || ev.pointerId !== d.pointerId) return;
      endDrag();
      if (!d.active) return;
      const target = linesAtPoint(ev.clientX, ev.clientY)[0];
      if (target) handleAssignTrain(d.trainId, target.id);
    },
    [endDrag, linesAtPoint, handleAssignTrain],
  );

  const onDepotPointerCancel = useCallback(
    (e: RNPointerEvent) => {
      const d = dragRef.current;
      if (!d || e.nativeEvent.pointerId !== d.pointerId) return;
      endDrag();
    },
    [endDrag],
  );

  const isDragging = drag !== null;
  useEffect(() => {
    if (Platform.OS !== "web" || !isDragging) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") endDrag();
    };
    const onLeave = (ev: MouseEvent) => {
      if (!ev.relatedTarget) endDrag();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", endDrag);
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", endDrag);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [isDragging, endDrag]);

  // --- Animation Loop ---
  useEffect(() => {
    let frame = 0;
    let last: number | null = null;
    const animate = (now: number) => {
      const dt = last === null ? 0 : Math.min((now - last) / 1000, MAX_FRAME_S);
      last = now;
      setTrains((prev) => {
        if (!prev.some((t) => t.lineId)) return prev;
        const current = linesRef.current;
        return prev.map((t) => {
          if (!t.lineId) return t;
          const line = current.find((l) => l.id === t.lineId);
          return line ? advanceTrain(t, line, dt) : freeTrain(t);
        });
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // --- Derived State & Memoization ---

  const linesById = useMemo(
    () => Object.fromEntries(lines.map((l) => [l.id, l])) as Record<string, MetroLine>,
    [lines],
  );

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
      const pts = routeOf(line);
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

  const selectedStation = selectedId ? STATION_BY_ID[selectedId] : null;
  const hoverLineIds = drag?.active ? drag.hoverLineIds : [];
  const layout = boardSize ? boardScale(boardSize.width, boardSize.height) : null;

  const onBoardLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoardSize({ width, height });
  }, []);

  return (
    <View style={styles.wrap}>
      {toast ? (
        <Text
          style={[styles.toast, toast === LINE_BUSY_MSG && styles.toastNotice]}
          accessibilityLiveRegion="polite"
        >
          {toast}
        </Text>
      ) : (
        <View style={styles.toastPlaceholder} />
      )}

      {/* Metro Board Area */}
      <View
        ref={boardRef}
        style={styles.board}
        onLayout={onBoardLayout}
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
              onPress={() => deleteLine(seg.lineId)}
              accessibilityLabel="Eliminar línea"
            />
          ))}
          {segments.map((seg) => (
            <Line
              key={seg.key}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={seg.color}
              strokeWidth={hoverLineIds.includes(seg.lineId) ? STROKE * 2 : STROKE}
              strokeLinecap="round"
              pointerEvents="none"
            />
          ))}
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
          {STATIONS.map((station) => (
            <StationMark
              key={station.id}
              station={station}
              selected={station.id === selectedId}
            />
          ))}
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
        </Svg>

        {/* Trains in service: real-pixel size, never capture touches */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {layout
            ? trains.map((train) => {
                const line = train.lineId ? linesById[train.lineId] : undefined;
                if (!line) return null;
                const pts = routeOf(line);
                const distance = train.routeKey === routeKeyOf(line) ? train.distance : 0;
                const pos = pointOnRoute(pts, distance);
                const angle = train.direction === 1 ? pos.angle : pos.angle + 180;
                return (
                  <View
                    key={train.id}
                    pointerEvents="none"
                    style={[
                      styles.trainOnBoard,
                      {
                        left: layout.offsetX + pos.x * layout.scale - TRAIN_W / 2,
                        top: layout.offsetY + pos.y * layout.scale - TRAIN_H / 2,
                      },
                    ]}
                  >
                    <TrainVisual trainId={train.id} color={line.color} angle={angle} />
                  </View>
                );
              })
            : null}
        </View>
      </View>

      {/* Depot Area */}
      <TrainDepot
        trains={trains}
        linesById={linesById}
        draggingId={drag ? drag.trainId : null}
        onPointerDown={onDepotPointerDown}
        onPointerMove={onDepotPointerMove}
        onPointerUp={onDepotPointerUp}
        onPointerCancel={onDepotPointerCancel}
        onRemoveTrain={handleRemoveTrain}
      />

      {drag?.active ? (
        <View
          pointerEvents="none"
          style={[
            styles.dragGhost,
            { left: drag.x - TRAIN_W / 2, top: drag.y - TRAIN_H / 2 },
          ]}
        >
          <TrainVisual trainId={drag.trainId} color={DEPOT_GREY} angle={0} />
        </View>
      ) : null}
    </View>
  );
}

const TRAIN_W = 44;
const TRAIN_H = 22;

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 8,
  },
  toast: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    minHeight: 20,
  },
  toastNotice: {
    color: NOTICE_GREY,
  },
  toastPlaceholder: {
    minHeight: 20,
  },
  board: {
    width: "100%",
    aspectRatio: VIEW_W / VIEW_H,
  },
  depotContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  depotStatus: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    color: "#374151",
  },
  trainSlots: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  slot: {
    flex: 1,
    minWidth: 44,
    minHeight: 124,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 8,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 4,
    gap: 4,
  },
  slotDragging: {
    borderStyle: "dashed",
    borderColor: "#6b7280",
  },
  slotNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  dragHandle: {
    minWidth: 44,
    minHeight: 44,
    alignSelf: "stretch",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  },
  slotLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  slotDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  slotLineText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  trainVisual: {
    width: TRAIN_W,
    height: TRAIN_H,
    borderRadius: TRAIN_H / 2,
    borderWidth: 3,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  trainNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    lineHeight: 14,
  },
  trainArrow: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    lineHeight: 14,
  },
  trainOnBoard: {
    position: "absolute",
  },
  dragGhost: {
    position: (Platform.OS === "web" ? "fixed" : "absolute") as "absolute",
    zIndex: 1000,
    elevation: 10,
    opacity: 0.9,
  },
  removeButton: {
    alignSelf: "stretch",
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});
