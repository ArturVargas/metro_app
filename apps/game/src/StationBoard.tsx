import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Line, Polygon, Rect } from "react-native-svg";

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

const VIEW_W = 400;
const VIEW_H = 300;
const VIEW_BOX = `0 0 ${VIEW_W} ${VIEW_H}`;
const STATION_SIZE = 14;
const HIT_R = 22;
const STROKE = 8;
const MAX_LINES = 3;
const LINE_COLORS = ["#2563eb", "#16a34a", "#ea580c"] as const; // azul, verde, anaranjada
const TOAST_MS = 2000;
const SELECT_STROKE = "#dc2626"; // borde rojo

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

type LayoutSize = { width: number; height: number };

function localToSvg(x: number, y: number, layout: LayoutSize): { x: number; y: number } {
  const scale = Math.min(layout.width / VIEW_W, layout.height / VIEW_H);
  const offsetX = (layout.width - VIEW_W * scale) / 2;
  const offsetY = (layout.height - VIEW_H * scale) / 2;
  return {
    x: (x - offsetX) / scale,
    y: (y - offsetY) / scale,
  };
}

function findStationAt(svgX: number, svgY: number): Station | null {
  for (const s of STATIONS) {
    const dx = svgX - s.x;
    const dy = svgY - s.y;
    if (dx * dx + dy * dy <= HIT_R * HIT_R) return s;
  }
  return null;
}

function endpointsOf(line: MetroLine): [string, string] {
  const ids = line.stationIds;
  return [ids[0], ids[ids.length - 1]];
}

function linesWithEndpoint(
  lines: MetroLine[],
  stationId: string,
): MetroLine[] {
  return lines.filter((l) => {
    if (l.closed) return false;
    const [a, b] = endpointsOf(l);
    return a === stationId || b === stationId;
  });
}

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
      stroke={SELECT_STROKE}
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

export function StationBoard(): React.JSX.Element {
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guide, setGuide] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutSize>({ width: VIEW_W, height: VIEW_H });
  const draggingRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    draggingRef.current = false;
  }, []);

  const nextColor = useCallback(
    (current: MetroLine[]) => LINE_COLORS[current.length] ?? null,
    [],
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

          // Cerrar circuito (≥3 estaciones).
          if (toId === otherEnd && ids.length >= 3) {
            return prev.map((l) =>
              l.id === extendTarget.id ? { ...l, closed: true } : l,
            );
          }

          // No repetir estación (salvo cierre, ya manejado).
          if (ids.includes(toId)) {
            return prev;
          }

          const nextIds = atStart ? [toId, ...ids] : [...ids, toId];
          return prev.map((l) =>
            l.id === extendTarget.id ? { ...l, stationIds: nextIds } : l,
          );
        }

        // Nueva línea
        if (prev.length >= MAX_LINES) {
          showToast("Máximo 3 líneas");
          return prev;
        }
        const color = nextColor(prev);
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
    [clearSelection, nextColor, showToast],
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

  const onBoardLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  }, []);

  const pointerToSvg = useCallback(
    (locationX: number, locationY: number) =>
      localToSvg(locationX, locationY, layout),
    [layout],
  );

  const onBoardGrant = useCallback(
    (locationX: number, locationY: number) => {
      const { x, y } = pointerToSvg(locationX, locationY);
      const hit = findStationAt(x, y);
      if (hit) {
        draggingRef.current = true;
        if (!selectedId) {
          setSelectedId(hit.id);
          setGuide({ x: hit.x, y: hit.y });
        } else if (selectedId === hit.id) {
          clearSelection();
        } else {
          connect(selectedId, hit.id);
        }
        return;
      }
      // vacío
      if (selectedId) clearSelection();
    },
    [pointerToSvg, selectedId, clearSelection, connect],
  );

  const onBoardMove = useCallback(
    (locationX: number, locationY: number) => {
      if (!selectedId) return;
      const { x, y } = pointerToSvg(locationX, locationY);
      setGuide({ x, y });
    },
    [selectedId, pointerToSvg],
  );

  const onBoardRelease = useCallback(
    (locationX: number, locationY: number) => {
      if (!selectedId || !draggingRef.current) return;
      const { x, y } = pointerToSvg(locationX, locationY);
      const hit = findStationAt(x, y);
      draggingRef.current = false;
      if (hit && hit.id !== selectedId) {
        connect(selectedId, hit.id);
        return;
      }
      if (!hit) {
        // suelta en vacío → cancelar (también cubre tap-tap si no hubo drag real)
        // En modo tap-tap desktop/móvil: el release sobre vacío cancela.
        // Si el release es sobre la misma estación sin moverse, mantener selección
        // para permitir segundo toque; solo cancelar si fue drag lejos.
        const origin = STATION_BY_ID[selectedId];
        const dx = x - origin.x;
        const dy = y - origin.y;
        const moved = dx * dx + dy * dy > HIT_R * HIT_R;
        if (moved) clearSelection();
        else setGuide({ x: origin.x, y: origin.y });
      }
    },
    [selectedId, pointerToSvg, connect, clearSelection],
  );

  // Mouse rubber-band en web (sigue al puntero sin exigir drag desde estación).
  useEffect(() => {
    if (Platform.OS !== "web" || !selectedId) return;
    const handler = (ev: MouseEvent) => {
      const el = document.querySelector(
        '[data-metro-board="a"]',
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

  const segments = useMemo(() => {
    const out: { key: string; x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    for (const line of lines) {
      const ids = line.stationIds;
      for (let i = 0; i < ids.length - 1; i++) {
        const a = STATION_BY_ID[ids[i]];
        const b = STATION_BY_ID[ids[i + 1]];
        out.push({
          key: `${line.id}-${i}`,
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

  return (
    <View style={styles.wrap}>
      {toast ? (
        <Text style={styles.toast} accessibilityLiveRegion="polite">
          {toast}
        </Text>
      ) : (
        <View style={styles.toastPlaceholder} />
      )}
      <View
        style={styles.board}
        accessibilityLabel="Tablero de estaciones"
        onLayout={onBoardLayout}
        // @ts-expect-error data attr for web mouse tracking
        dataSet={{ metroBoard: "a" }}
        nativeID="metro-board-a"
        {...(Platform.OS === "web"
          ? ({ "data-metro-board": "a" } as object)
          : {})}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          onBoardGrant(locationX, locationY);
        }}
        onResponderMove={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          onBoardMove(locationX, locationY);
        }}
        onResponderRelease={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          onBoardRelease(locationX, locationY);
        }}
        onResponderTerminate={() => {
          draggingRef.current = false;
        }}
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
          />
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
          {selectedStation && guide ? (
            <Line
              x1={selectedStation.x}
              y1={selectedStation.y}
              x2={guide.x}
              y2={guide.y}
              stroke={SELECT_STROKE}
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
          {/* Hit targets encima para tap-tap preciso */}
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
      </View>
    </View>
  );
}

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
  toastPlaceholder: {
    minHeight: 20,
  },
  board: {
    width: "100%",
    aspectRatio: VIEW_W / VIEW_H,
  },
});
