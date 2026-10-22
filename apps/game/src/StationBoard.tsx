import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
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
  // Added for train tracking
  trainId: string | null;
};

// Train State
type Train = {
  id: string;
  lineId: string | null;
  isMoving: boolean;
  progress: number; // 0.0 to 1.0 along the current segment
  currentSegmentKey: string; // Key identifying the segment it's on
  startTime: number;
  totalDuration: number; // Time needed to traverse the current segment
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

/** Paleta B (sin naranja/rojo de alerta). */
const LINE_COLORS = ["#0072B2", "#009E73", "#CC79A7"] as const;
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

// --- Utility Functions ---

/** Gets the two endpoints of a line. */
function endpointsOf(line: MetroLine): [string, string] {
  const ids = line.stationIds;
  return [ids[0], ids[ids.length - 1]];
}

/** Filters lines that use the given station ID as an endpoint. */
function linesWithEndpoint(lines: MetroLine[], stationId: string): MetroLine[] {
  return lines.filter((l) => {
    if (l.trainId !== null) return false; // Only consider lines without trains for connection logic
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

/** Calculates the segment key for a given line and index i. */
function getSegmentKey(lineId: string, i: number): string {
    return `${lineId}-${i}`;
}

/** Calculates the segment key for the closing segment of a circuit. */
function getClosingSegmentKey(lineId: string): string {
    return `${lineId}-close`;
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

// --- Train Depot Component ---
interface TrainDepotProps {
    trains: Train[];
    onDragStart: (trainId: string) => void;
    onDragEnd: (trainId: string, targetLineId: string | null) => void;
    onRemoveTrain: (trainId: string) => void;
}

const TrainDepot: React.FC<TrainDepotProps> = ({
    trains,
    onDragStart,
    onDragEnd,
    onRemoveTrain
}) => {
    const depotTrains = trains.filter(t => t.lineId === null);
    const inServiceTrains = trains.filter(t => t.lineId !== null);

    const handleDragStart = (trainId: string) => {
        onDragStart(trainId);
    };

    // Note: In a real implementation, the parent component must capture the drop target ID.
    const handleDragEnd = (trainId: string, targetLineId: string | null) => {
        onDragEnd(trainId, targetLineId);
    };

    return (
        <View style={styles.depotContainer}>
            <Text style={styles.depotStatus}>
                En la cochera: {depotTrains.length} · En servicio: {inServiceTrains.length}
            </Text>
            <View style={styles.trainSlots}>
                {Array.from({ length: NUM_TRAINS }).map((_, index) => {
                    const trainId = `train-${index + 1}`;
                    const train = trains.find(t => t.id === trainId);
                    const isOccupied = !!train;
                    const isDepot = train?.lineId === null;

                    return (
                        <View
                            key={trainId}
                            style={styles.slot}
                        >
                                <View
                                    style={[
                                        styles.trainVisual,
                                        {
                                            borderColor: isOccupied ? (isDepot ? '#ccc' : '#aaa') : '#ccc',
                                            backgroundColor: isOccupied ? (isDepot ? '#fff' : '#eee') : '#fff',
                                        }
                                    ]}
                                >
                                    <Text style={styles.trainNumber}>{index + 1}</Text>
                                    {isOccupied && (
                                        <TouchableOpacity 
                                            onPress={() => onRemoveTrain(trainId)}
                                            style={styles.removeButton}
                                        >
                                            Retirar
                                        </TouchableOpacity>
                                    )}
                                </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

// --- Train Visualization Component ---
interface TrainVisualProps {
    train: Train;
    lineColor: string;
    onDragStart: (trainId: string) => void;
    onDragEnd: (trainId: string, targetLineId: string | null) => void;
}

const TrainVisual: React.FC<TrainVisualProps> = ({
    train,
    lineColor,
    onDragStart,
    onDragEnd
}) => {
    const trainId = train.id;

    return (
            <View
                style={[
                    styles.trainVisual,
                    {
                        borderColor: lineColor,
                        backgroundColor: '#fff',
                    }
                ]}
            >
                <Text style={styles.trainNumber}>{trainId.slice(-1)}</Text>
                <TouchableOpacity 
                    onPress={() => onDragStart(trainId)}
                    style={styles.removeButton}
                >
                    Retirar
                </TouchableOpacity>
            </View>
    );
};


// --- Main Component ---

export function StationBoard(): React.JSX.Element {
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guide, setGuide] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Train State Management
  const [trains, setTrains] = useState<Train[]>([]);
  const trainTimer = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const lastUpdateTime = useRef(0);

  // --- Toast Management ---
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (trainTimer.current) cancelAnimationFrame(trainTimer.current);
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
      setLines((prev) => {
        const newLines = prev.filter((l) => l.id !== lineId);
        
        // 1. Update trains: If the deleted line had a train, free it.
        setTrains(prevTrains => prevTrains.map(t => 
            t.lineId === lineId ? { ...t, lineId: null, isMoving: false, progress: 0, currentSegmentKey: '', startTime: 0, totalDuration: 0 } : t
        ));
        
        showToast("Línea eliminada. Tren liberado.");
        return newLines;
      });
    },
    [showToast],
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
            const newLines = prev.map((l) =>
              l.id === extendTarget.id ? { ...l, closed: true } : l,
            );
            setLines(newLines);
            showToast("Circuito cerrado.");
            return newLines;
          }

          if (ids.includes(toId)) {
            showToast("La estación ya está en esta línea.");
            return prev;
          }

          const nextIds = atStart ? [toId, ...ids] : [...ids, toId];
          const newLines = prev.map((l) =>
            l.id === extendTarget.id ? { ...l, stationIds: nextIds } : l,
          );
          setLines(newLines);
          showToast("Línea extendida.");
          return newLines;
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
        const newLine: MetroLine = {
            id: `line-${Date.now()}-${prev.length}`,
            color,
            stationIds: [fromId, toId],
            createdAt: Date.now(),
            closed: false,
            trainId: null,
        };
        setLines([...prev, newLine]);
        showToast("Nueva línea creada.");
        return [...prev, newLine];
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

  // --- Train Management ---

  /** Initializes or resets the train state. */
  const initializeTrains = useCallback((initialLines: MetroLine[]) => {
    const initialTrains: Train[] = [];
    const lineTrainIds = new Set<string>();

    // 1. Check existing trains assigned to lines
    const existingTrains: Train[] = initialLines.map(line => ({
        id: `train-${Math.random().toString(36).substring(2, 6)}`, // Unique ID for simulation
        lineId: line.id,
        isMoving: false,
        progress: 0,
        currentSegmentKey: '',
        startTime: 0,
        totalDuration: 0,
    }));

    // 2. Fill remaining slots with free trains
    const assignedTrainIds = new Set(existingTrains.map(t => t.id));
    const freeTrains: Train[] = [];
    for (let i = 0; i < NUM_TRAINS; i++) {
        const trainId = `train-${i + 1}`;
        if (!assignedTrainIds.has(trainId)) {
            freeTrains.push({
                id: trainId,
                lineId: null,
                isMoving: false,
                progress: 0,
                currentSegmentKey: '',
                startTime: 0,
                totalDuration: 0,
            });
        }
    }
    
    setTrains([...existingTrains, ...freeTrains]);
  }, []);

  // Initialize trains whenever lines change (or on mount)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeTrains(lines);
  }, [lines, initializeTrains]);


  /** Handles assigning a train from the depot. */
  const handleAssignTrain = useCallback((trainId: string, targetLineId: string | null) => {
    setTrains(prevTrains => {
        const trainIndex = prevTrains.findIndex(t => t.id === trainId);
        if (trainIndex === -1) return prevTrains;

        const train = prevTrains[trainIndex];
        
        if (targetLineId === null) {
            // Case 5: Dropped nowhere or cancelled -> Train returns to depot
            return prevTrains.map((t, i) => i === trainIndex ? { ...t, lineId: null, isMoving: false, progress: 0, currentSegmentKey: '', startTime: 0, totalDuration: 0 } : t);
        }

        // Case 4: Dropped on a line
        const line = lines.find(l => l.id === targetLineId);
        if (!line) {
            return prevTrains;
        }

        // Check if line already has a train (Rule 5)
        if (line.trainId) {
            showToast("Esa línea ya tiene tren");
            return prevTrains; // No change
        }

        // Assign train and start movement
        const newTrain: Train = {
            id: trainId,
            lineId: targetLineId,
            isMoving: true,
            progress: 0,
            currentSegmentKey: '',
            startTime: performance.now(),
            totalDuration: 0,
        };

        // Find the first segment to calculate initial movement parameters
        const initialSegment = linesWithEndpoint(lines, line.stationIds[0]).find(l => l.id === targetLineId);
        if (initialSegment) {
            const initialSegmentKey = getSegmentKey(targetLineId, 0);
            const segmentData = line.stationIds.length >= 2;
            
            if (segmentData) {
                newTrain.currentSegmentKey = initialSegmentKey;
                // Set initial duration based on segment length (simplified: assume fixed travel time per segment)
                newTrain.totalDuration = 1000; // 1 second travel time per segment for simulation
            }
        }

        return prevTrains.map((t, i) => i === trainIndex ? { ...newTrain } : t);
    });
  }, [lines, showToast]);

  const handleDragStartDepot = useCallback(() => {}, []);
  const handleDragEndDepot = handleAssignTrain;

  /** Handles removing a train from a line. */
  const handleRemoveTrain = useCallback((trainId: string) => {
    setTrains(prevTrains => {
        const trainIndex = prevTrains.findIndex(t => t.id === trainId);
        if (trainIndex === -1) return prevTrains;

        const train = prevTrains[trainIndex];
        
        // Reset train state to depot
        const updatedTrains = prevTrains.map((t, i) => i === trainIndex ? { 
            ...t, 
            lineId: null, 
            isMoving: false, 
            progress: 0, 
            currentSegmentKey: '', 
            startTime: 0, 
            totalDuration: 0 
        } : t);
        
        // Update line state: remove trainId from the line object
        setLines(prevLines => prevLines.map(l => 
            l.id === train.lineId ? { ...l, trainId: null } : l
        ));
        
        showToast("Tren retirado y puesto en cochera.");
        return updatedTrains;
    });
  }, [showToast]);

  // --- Animation Loop ---
  useEffect(() => {
    if (trains.every(t => !t.isMoving)) {
        if (trainTimer.current) cancelAnimationFrame(trainTimer.current);
        return;
    }

    const animate = () => {
        const now = performance.now();
        const deltaTime = now - lastUpdateTime.current;
        lastUpdateTime.current = now;

        setTrains(prevTrains => {
            const updatedTrains = prevTrains.map(train => {
                if (!train.isMoving) return train;

                const line = lines.find(l => l.id === train.lineId);
                if (!line) return train;

                const elapsed = now - train.startTime;
                
                // Simple movement simulation: progress increases over time
                const newProgress = Math.min(1.0, elapsed / train.totalDuration);

                if (newProgress >= 1.0) {
                    // Simulate reaching the end of the segment and moving to the next one
                    // In a real scenario, this logic would find the next segment key and update totalDuration.
                    return { 
                        ...train, 
                        progress: 0, 
                        startTime: now, 
                        totalDuration: 1000, // Reset duration for next segment
                        currentSegmentKey: train.currentSegmentKey // Keep key for drawing context
                    };
                }

                return { 
                    ...train, 
                    progress: newProgress, 
                    startTime: train.startTime,
                    totalDuration: train.totalDuration
                };
            });
            return updatedTrains;
        });

        trainTimer.current = requestAnimationFrame(animate);
    };

    trainTimer.current = requestAnimationFrame(animate);

    return () => {
        if (trainTimer.current) cancelAnimationFrame(trainTimer.current);
    };
  }, [trains, lines]);


  // --- Derived State & Memoization ---

  const { segments: drawingSegments, segmentMap } = useMemo(() => {
    const segments: any[] = [];
    const segmentMap = new Map<string, { start: Station; end: Station; color: string; isClosed: boolean; isClosingSegment: boolean }>();

    for (const line of lines) {
        const ids = line.stationIds;
        
        // 1. Straight segments
        for (let i = 0; i < ids.length - 1; i++) {
            const a = STATION_BY_ID[ids[i]];
            const b = STATION_BY_ID[ids[i + 1]];
            const key = getSegmentKey(line.id, i);
            segments.push({
                key: key,
                lineId: line.id,
                x1: a.x,
                y1: a.y,
                x2: b.x,
                y2: b.y,
                color: line.color,
                isClosed: false,
                isClosingSegment: false,
            });
            segmentMap.set(key, { start: a, end: b, color: line.color, isClosed: false, isClosingSegment: false });
        }

        // 2. Closing segment (Circuit)
        if (line.closed && ids.length >= 3) {
            const a = STATION_BY_ID[ids[ids.length - 1]];
            const b = STATION_BY_ID[ids[0]];
            const key = getClosingSegmentKey(line.id);
            segments.push({
                key: key,
                lineId: line.id,
                x1: a.x,
                y1: a.y,
                x2: b.x,
                y2: b.y,
                color: line.color,
                isClosed: true,
                isClosingSegment: true,
            });
            segmentMap.set(key, { start: a, end: b, color: line.color, isClosed: true, isClosingSegment: true });
        }
    }
    return { segments, segmentMap };
  }, [lines]);

  const selectedStation = selectedId ? STATION_BY_ID[selectedId] : null;

  // --- Render Train Position ---
  const renderTrainPosition = useCallback((train: Train, line: MetroLine) => {
    if (!train.isMoving || !line) return null;

    const segmentKey = train.currentSegmentKey;
    const segmentData = segmentMap.get(segmentKey);

    if (!segmentData) return null;

    const { start: startStation, end: endStation, color: lineColor } = segmentData;
    
    // Calculate position based on progress (0.0 to 1.0)
    const x = startStation.x + (endStation.x - startStation.x) * train.progress;
    const y = startStation.y + (endStation.y - startStation.y) * train.progress;

    // Calculate the visual size (simplified)
    const width = Math.sqrt(Math.pow(endStation.x - startStation.x, 2) + Math.pow(endStation.y - startStation.y, 2));
    const visualWidth = Math.max(28, width * 0.8);

    return { x, y, width: visualWidth, lineColor };
  }, [segmentMap]);


  return (
    <View style={styles.wrap}>
      {toast ? (
        <Text style={styles.toast} accessibilityLiveRegion="polite">
          {toast}
        </Text>
      ) : (
        <View style={styles.toastPlaceholder} />
      )}
      
      {/* Metro Board Area */}
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
            onPress={() => onBackgroundPress()}
          />

          {/* Drawn Lines (Hit Area) */}
          {drawingSegments.map((seg) => (
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
              accessibilityLabel={`Eliminar tramo de línea ${seg.lineId}`}
            />
          ))}

          {/* Actual Line Traces */}
          {drawingSegments.map((seg) => (
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

          {/* Train Visualization */}
          {trains.map((train, index) => {
            const line = lines.find(l => l.id === train.lineId);
            if (!line) return null;

            const segmentKey = train.currentSegmentKey;
            const segmentData = segmentMap.get(segmentKey);

            if (!segmentData) return null;

            const { start: startStation, end: endStation, color: lineColor } = segmentData;
            
            // Calculate position based on progress (0.0 to 1.0)
            const x = startStation.x + (endStation.x - startStation.x) * train.progress;
            const y = startStation.y + (endStation.y - startStation.y) * train.progress;

            // Calculate the visual size (simplified)
            const width = Math.sqrt(Math.pow(endStation.x - startStation.x, 2) + Math.pow(endStation.y - startStation.y, 2));
            const visualWidth = Math.max(28, width * 0.8);

            return (
                <rect
                    key={`train-${train.id}`}
                    x={x - visualWidth / 2}
                    y={y - 7} // Height approximation
                    width={visualWidth}
                    height={14}
                    rx={3}
                    ry={3}
                    fill={lineColor}
                    stroke={lineColor}
                    strokeWidth={3}
                    pointerEvents="none"
                />
            );
          })}

          {/* Selection Guide */}
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
          
          {/* Hit Area for Station Selection */}
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

      {/* Depot Area */}
      <TrainDepot
        trains={trains}
        onDragStart={handleDragStartDepot}
        onDragEnd={handleDragEndDepot}
        onRemoveTrain={handleRemoveTrain}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 16,
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
  depotContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingTop: 10,
  },
  depotStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#374151',
  },
  trainSlots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  slot: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderStyle: 'dashed',
  },
  trainVisual: {
    flex: 1,
    height: '100%',
    borderRadius: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 3,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  trainNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 5,
  }
});
