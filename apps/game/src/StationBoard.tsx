import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
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

// --- Train State ---
type TrainState = {
  lineId: string;
  isActive: boolean;
  // Current index in stationIds array where the train is located
  currentStationIndex: number;
  // Direction: 1 for forward (increasing index), -1 for backward (decreasing index)
  direction: 1 | -1;
  // Time when the train last arrived/stopped at the current station (for 2s stop logic)
  lastStopTime: number;
  // Total time the train has been running (for simulation consistency)
  startTime: number;
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

/** Calculates the next station index and checks for boundary conditions. */
function getNextStationIndex(
  line: MetroLine,
  currentIndex: number,
  direction: 1 | -1
): {
  nextIndex: number;
  nextStationId: string;
  isBoundary: boolean;
  isCircuit: boolean;
} {
  const ids = line.stationIds;
  const nextIndex = currentIndex + direction;
  const isCircuit = line.closed && ids.length >= 3;

  if (nextIndex < 0 || nextIndex >= ids.length) {
    // Boundary reached
    return {
      nextIndex: nextIndex,
      nextStationId: "",
      isBoundary: true,
      isCircuit: isCircuit,
    };
  }

  const nextStationId = ids[nextIndex];
  const isBoundary = !isCircuit && (nextIndex === -1 || nextIndex === ids.length);

  return {
    nextIndex: nextIndex,
    nextStationId: nextStationId,
    isBoundary: isBoundary,
    isCircuit: isCircuit,
  };
}

// --- Components ---

interface TrainDisplayProps {
  line: MetroLine;
  trainState: TrainState | null;
  onToggleTrain: (lineId: string, trainState: TrainState | null) => void;
}

/** Displays the train icon and handles its movement simulation. */
const TrainDisplay: React.FC<TrainDisplayProps> = ({
  line,
  trainState,
  onToggleTrain,
}) => {
  const { stationIds } = line;
  const trainRef = useRef<View>(null);
  const [trainPosition, setTrainPosition] = useState<{ x: number; y: number; scale: number }>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isMoving, setIsMoving] = useState(false);

  // Effect to handle train movement simulation
  useEffect(() => {
    if (!trainState || !trainState.isActive) {
      return;
    }

    const intervalId = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = currentTime - trainState.startTime;
      const totalTime = elapsed / 1000; // Time in seconds

      // 1. Check for stop duration
      const isStopped = currentTime - trainState.lastStopTime < STOP_DURATION_MS;
      
      if (isStopped) {
        // Train is stopped at the current station
        setIsMoving(false);
        // Position is fixed at the current station's coordinates
        const station = STATION_BY_ID[stationIds[trainState.currentStationIndex]];
        setTrainPosition({ x: station.x, y: station.y, scale: 1 });
        return;
      }

      // 2. Calculate movement based on time elapsed since start/last move
      let newIndex = trainState.currentStationIndex;
      let newDirection = trainState.direction;
      let nextStationId: string | null = null;
      let boundaryHit = false;

      // Determine next potential position
      const { nextIndex, nextStationId: potentialNextId, isBoundary, isCircuit } = getNextStationIndex(
        line,
        trainState.currentStationIndex,
        trainState.direction
      );

      if (isBoundary && !isCircuit) {
        // Boundary hit (Open line)
        if (trainState.direction === 1) {
          // Hit end, reverse direction
          newDirection = -1;
          newIndex = trainState.currentStationIndex;
          nextStationId = stationIds[newIndex - 1]; // Move back one step
          boundaryHit = true;
        } else {
          // Hit start, reverse direction
          newDirection = 1;
          newIndex = trainState.currentStationIndex;
          nextStationId = stationIds[newIndex + 1]; // Move forward one step
          boundaryHit = true;
        }
      } else if (potentialNextId) {
        // Normal move or circuit move
        newDirection = newDirection;
        newIndex = nextIndex;
        nextStationId = potentialNextId;
      } else {
        // Should not happen if logic is correct, but stop simulation
        clearInterval(intervalId);
        return;
      }
      
      // Update state for next tick
      const nextStation = STATION_BY_ID[nextStationId || stationIds[newIndex]];
      
      // Simulate movement towards the next station center point
      const startStation = STATION_BY_ID[stationIds[trainState.currentStationIndex]];
      const endStation = nextStation;

      // Simple linear interpolation for visual movement (approximating speed)
      const progress = Math.min(1, (currentTime - trainState.startTime) / (TRAIN_SPEED_PX_PER_SECOND * 1000));
      
      // For simplicity and stability in this context, we will snap to the next station 
      // after a calculated travel time, simulating the fixed speed.
      
      // Since we are using setInterval, we approximate the time taken between stations.
      // Let's simplify: If we are not stopped, we move to the next station after a fixed interval.
      
      const travelTimeMs = 1500; // Time to travel between stations
      const timeSinceStart = currentTime - trainState.startTime;

      if (timeSinceStart < travelTimeMs) {
          // Still traveling to the next station
          const t = timeSinceStart / travelTimeMs;
          const x = startStation.x + (endStation.x - startStation.x) * t;
          const y = startStation.y + (endStation.y - startStation.y) * t;
          setTrainPosition({ x, y, scale: 1 });
          return;
      } else {
          // Arrived at the next station
          const nextStation = STATION_BY_ID[nextStationId!];
          setTrainPosition({ x: nextStation.x, y: nextStation.y, scale: 1 });
          
          // Update state for next tick
          onToggleTrain(line.id, {
              lineId: line.id,
              isActive: true,
              currentStationIndex: newIndex,
              direction: newDirection,
              lastStopTime: currentTime,
              startTime: currentTime,
          });
          
          // Schedule the next state update to handle the stop duration
          // The parent component handles the actual state update based on this logic.
      }

    }, 50); // Update every 50ms

    return () => clearInterval(intervalId);
  }, [trainState, line.id, onToggleTrain]); // Depend on trainState changes

  // --- Render Logic ---

  const getTrainColor = useMemo(() => line.color, [line.color]);

  // Visual representation of the train (a simple colored circle)
  const TrainIcon = (
    <View
      ref={trainRef}
      style={[
        styles.trainBody,
        {
          backgroundColor: getTrainColor,
          transform: [{ scale: trainPosition.scale }],
          left: trainPosition.x - 15, // Center the 30px width around x
          top: trainPosition.y - 15, // Center the 30px height around y
        }
      ]}
      accessibilityLabel={`Tren de la Línea ${line.id.replace('line-', '')}`}
    />
  );

  return (
    <View style={styles.trainContainer}>
      {trainState ? (
        <>
          {TrainIcon}
          <Text style={styles.trainLabel}>T{line.id.replace('line-', '')}</Text>
        </>
      ) : (
        <Text style={styles.trainPlaceholder}>Sin tren asignado</Text>
      )}
      <TouchableOpacity
        onPress={() => onToggleTrain(line.id, trainState ? null : {
            lineId: line.id,
            isActive: true,
            currentStationIndex: 0,
            direction: 1,
            lastStopTime: Date.now(),
            startTime: Date.now(),
        })}
        disabled={!!trainState}
        style={styles.button}
        testID={`btn-toggle-train-${line.id}`}
      >
        <Text style={styles.buttonText}>
          {trainState ? "Retirar tren" : "Asignar tren"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};


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
  const [trainStates, setTrainStates] = useState<Record<string, TrainState | null>>({});
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Toast Management ---
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    },
    [],
  );

  // --- Line Management ---
  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setGuide(null);
  }, []);

  const deleteLine = useCallback(
    (lineId: string) => {
      setLines((prev) => {
        const newLines = prev.filter((l) => l.id !== lineId);
        setTrainStates((prevStates) => {
            const newState = { ...prevStates };
            delete newState[lineId];
            return newState;
        });
        return newLines;
      });
      clearSelection();
      showToast("Línea eliminada.");
    },
    [clearSelection, showToast],
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

  // --- Train Control Handlers ---

  /** Toggles the train state for a given line. */
  const handleToggleTrain = useCallback((lineId: string, newTrainState: TrainState | null) => {
    setTrainStates((prevStates) => {
      const currentTrainState = prevStates[lineId];
      let newState: Record<string, TrainState | null> = { ...prevStates };

      if (newTrainState === null) {
        // Retiring the train
        newState[lineId] = null;
        showToast(`Tren de Línea ${lineId.replace('line-', '')} retirado.`);
      } else {
        // Assigning or Reassigning the train
        if (currentTrainState && currentTrainState.isActive) {
            // If already active, we just reset its position/timer to restart it
            showToast(`Tren de Línea ${lineId.replace('line-', '')} reasignado.`);
        } else {
            showToast(`Tren de Línea ${lineId.replace('line-', '')} asignado.`);
        }
        
        newState[lineId] = {
            lineId: lineId,
            isActive: true,
            currentStationIndex: 0, // Always start at the first station
            direction: 1, // Always start moving forward initially
            lastStopTime: Date.now(),
            startTime: Date.now(),
        };
      }
      return newState;
    });
  }, [showToast]);


  // --- Simulation Loop ---
  const simulateMovement = useCallback(() => {
    const now = Date.now();
    let updatedStates: Record<string, TrainState | null> = { ...trainStates };

    Object.keys(trainStates).forEach((lineId) => {
      const line = lines.find((l) => l.id === lineId);
      const trainState = trainStates[lineId];

      if (!line || !trainState || !trainState.isActive) {
        return;
      }

      const stationIds = line.stationIds;
      const currentStation = STATION_BY_ID[stationIds[trainState.currentStationIndex]];
      
      // 1. Check for stop duration
      if (now - trainState.lastStopTime < STOP_DURATION_MS) {
        // Still stopped, do nothing, just let the UI render the stop
        return;
      }

      // 2. Determine next move
      const { nextIndex, nextStationId: potentialNextId, isBoundary, isCircuit } = getNextStationIndex(
        line,
        trainState.currentStationIndex,
        trainState.direction
      );

      if (isBoundary && !isCircuit) {
        // Boundary hit (Open line)
        let newDirection = trainState.direction;
        let newIndex = trainState.currentStationIndex;
        let nextStationId: string | null = null;

        if (trainState.direction === 1) {
          // Hit end, reverse direction
          newDirection = -1;
          newIndex = trainState.currentStationIndex;
          nextStationId = stationIds[newIndex - 1];
        } else {
          // Hit start, reverse direction
          newDirection = 1;
          newIndex = trainState.currentStationIndex;
          nextStationId = stationIds[newIndex + 1];
        }
        
        // Update state for next tick
        updatedStates[lineId] = {
            ...trainState,
            direction: newDirection,
            currentStationIndex: newIndex,
            lastStopTime: now,
            startTime: now,
        };
        
        // If we successfully calculated a next station, we need to update the state to reflect the move
        if (nextStationId) {
            updatedStates[lineId] = {
                ...updatedStates[lineId],
                currentStationIndex: newIndex,
                direction: newDirection,
                lastStopTime: now,
                startTime: now,
            };
        }
        return;
      }

      if (potentialNextId) {
        // Normal move or circuit move
        const nextStation = STATION_BY_ID[potentialNextId];
        const startStation = STATION_BY_ID[stationIds[trainState.currentStationIndex]];
        
        // Simulate travel time (e.g., 1.5 seconds)
        const travelTimeMs = 1500; 
        const timeSinceStart = now - trainState.startTime;

        if (timeSinceStart < travelTimeMs) {
            // Still traveling, do nothing to state, just let the visual component handle interpolation
            return;
        } else {
            // Arrived at the next station
            updatedStates[lineId] = {
                ...trainState,
                currentStationIndex: nextIndex,
                direction: trainState.direction,
                lastStopTime: now,
                startTime: now,
            };
        }
      }
    });

    setTrainStates(updatedStates);
  }, [lines, trainStates]);


  // --- Simulation Effect Hook ---
  useEffect(() => {
    if (lines.length === 0) return;

    // Set up the simulation loop
    const intervalId = setInterval(() => {
      simulateMovement();
    }, 50); // Run simulation logic every 50ms

    simulationIntervalRef.current = intervalId;

    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [lines, simulateMovement]);


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
      lineId: string;
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
          lineId: line.id,
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
          lineId: line.id,
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
              onPress={() => deleteLine(seg.lineId)}
              accessibilityLabel={`Eliminar tramo de línea ${seg.lineId.replace('line-', '')}`}
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
          
          {/* Stations */}
          {STATIONS.map((station) => (
            <StationMark
              key={station.id}
              station={station}
              selected={station.id === selectedId}
            />
          ))}
          
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
        </Svg>
      </View>

      {/* Train Panel */}
      <View style={styles.trainPanel}>
        <Text style={styles.panelTitle}>Gestión de Trenes</Text>
        <View style={styles.trainList}>
          {lines.map((line) => (
            <TrainDisplay
              key={line.id}
              line={line}
              trainState={trainStates[line.id] || null}
              onToggleTrain={handleToggleTrain}
            />
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  trainPlaceholder: {
    fontSize: 14,
    color: '#6b7280',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    minWidth: 120,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Train Visuals
  trainBody: {
    width: 30,
    height: 30,
    borderRadius: 5,
    position: 'absolute', // Positioned absolutely relative to the container's coordinates
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // Note: Actual positioning relies on the parent container's coordinate system matching the SVG viewbox scale.
  },
  trainLabel: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  }
});
