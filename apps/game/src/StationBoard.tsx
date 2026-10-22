import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StyleProp,
} from "react-native";
import Svg, { Circle, Line, Polygon, Rect } from "react-native-svg";

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
  color: string;
  stationIds: string[];
  createdAt: number;
  closed: boolean;
  trainId: string | null; // Link to the train assigned
};

type Train = {
  id: string;
  lineId: string;
  speed: number; // Units per second
  currentStationIndex: number; // Index in stationIds array
  progress: number; // Distance traveled in current segment (0 to segmentLength)
  direction: 1 | -1; // 1 for forward, -1 for backward
  isMoving: boolean;
  lastStopTime: number; // Timestamp when it arrived/started waiting
  isWaiting: boolean;
  // Simulation state tracking
  totalDistanceTraveled: number;
};

const VIEW_W = 400;
const VIEW_H = 300;
const VIEW_BOX = `0 0 ${VIEW_W} ${VIEW_H}`;
const STATION_SIZE = 14;
const HIT_R = 22; // 44×44
const STROKE = 8;
const HIT_STROKE = 20;
const MAX_LINES = 3;
const TRAIN_MODULE_WIDTH = 30; // Approximate width for T1, T2, T3 visualization
const TRAIN_MODULE_HEIGHT = 20; // Approximate height

/** Paleta B (sin naranja/rojo de alerta). */
const LINE_COLORS = ["#0072B2", "#009E73", "#CC79A7"] as const;
const TOAST_MS = 2000;
const SELECT_RING = "#555555";
const TRAIN_SPEED = 50; // Units per second
const STOP_DURATION = 2000; // 2 seconds stop time

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

/** Renders the train module based on line color and train ID. */
const TrainVisualization: React.FC<{ lineColor: string; trainId: string; isVisible: boolean }> = ({
  lineColor,
  trainId,
  isVisible,
}) => {
  if (!isVisible) return null;

  // T1: {_}, T2: {_}{_}, T3: {_}{_}{_}
  const modules = {
    T1: <Rect x={0} y={0} width={TRAIN_MODULE_WIDTH} height={TRAIN_MODULE_HEIGHT} fill={lineColor} />,
    T2: (
      <>
        <Rect x={0} y={0} width={TRAIN_MODULE_WIDTH} height={TRAIN_MODULE_HEIGHT} fill={lineColor} />
        <Rect x={TRAIN_MODULE_WIDTH} y={0} width={TRAIN_MODULE_WIDTH} height={TRAIN_MODULE_HEIGHT} fill={lineColor} />
      </>
    ),
    T3: (
      <>
        <Rect x={0} y={0} width={TRAIN_MODULE_WIDTH} height={TRAIN_MODULE_HEIGHT} fill={lineColor} />
        <Rect x={TRAIN_MODULE_WIDTH} y={0} width={TRAIN_MODULE_WIDTH} height={TRAIN_MODULE_HEIGHT} fill={lineColor} />
        <Rect x={TRAIN_MODULE_WIDTH * 2} y={0} width={TRAIN_MODULE_WIDTH} height={TRAIN_MODULE_HEIGHT} fill={lineColor} />
      </>
    ),
  };

  // Determine which train type this is (T1, T2, or T3) based on the ID structure
  let TrainComponent;
  if (trainId.includes('T1')) {
    TrainComponent = modules.T1;
  } else if (trainId.includes('T2')) {
    TrainComponent = modules.T2;
  } else if (trainId.includes('T3')) {
    TrainComponent = modules.T3;
  } else {
    return null;
  }

  // The train visualization is rendered as a group that moves together.
  // We use a group element and transform it based on its calculated position.
  return (
    <g transform={`translate(0, 0)`}>
      {TrainComponent}
    </g>
  );
};

// --- Main Component ---

export function StationBoard(): React.JSX.Element {
  // --- State Management ---
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [trains, setTrains] = useState<Record<string, Train>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guide, setGuide] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null); // Line ID being edited
  const [showMenu, setShowMenu] = useState<{ lineId: string; type: 'edit' | 'delete' | 'manage' } | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef<number>(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Simulation Helpers ---

  /** Calculates the segment geometry between two stations. */
  const getSegmentGeometry = useCallback(
    (id1: string, id2: string): { x1: number; y1: number; x2: number; y2: number; length: number } => {
      const s1 = STATION_BY_ID[id1];
      const s2 = STATION_BY_ID[id2];
      if (!s1 || !s2) return { x1: 0, y1: 0, x2: 0, y2: 0, length: 0 };
      const dx = s2.x - s1.x;
      const dy = s2.y - s1.y;
      return { x1: s1.x, y1: s1.y, x2: s2.x, y2: s2.y, length: Math.sqrt(dx * dx + dy * dy) };
    },
    []
  );

  /**
   * Finds the next station and updates the train's state.
   * @param trainId The ID of the train to update.
   * @param currentTime Current time in milliseconds.
   * @returns Updated train state.
   */
  const updateTrainPosition = useCallback(
    (trainId: string, currentTime: number): Train => {
      const train = trains[trainId];
      if (!train) return train;

      const line = lines.find((l) => l.id === train.lineId);
      if (!line) return train;

      const stationIds = line.stationIds;
      const currentSegmentIndex = train.currentStationIndex;
      const nextStationIndex = (train.direction === 1)
        ? Math.min(currentSegmentIndex + 1, stationIds.length - 1)
        : Math.max(currentSegmentIndex - 1, 0);

      const nextStationId = stationIds[nextStationIndex];
      const currentStationId = stationIds[currentSegmentIndex];

      // 1. Determine segment geometry
      const segment = getSegmentGeometry(currentStationId, nextStationId);
      const segmentLength = segment.length;

      // 2. Calculate movement based on time elapsed since last update
      const timeDelta = (currentTime - (train.lastStopTime + (train.isWaiting ? STOP_DURATION : 0)));
      const distanceToMove = (timeDelta / 1000) * TRAIN_SPEED;

      let newProgress = train.progress + distanceToMove;
      let newDirection = train.direction;
      let newStationIndex = train.currentStationIndex;
      let newIsMoving = true;
      let newIsWaiting = false;

      if (newProgress >= segmentLength) {
        // Reached the next station
        newProgress = segmentLength;
        newStationIndex = nextStationIndex;
        
        // Update state for arrival
        const arrivalTime = currentTime;
        const waitEndTime = arrivalTime + STOP_DURATION;

        if (line.closed && nextStationIndex === 0 && currentSegmentIndex === stationIds.length - 1) {
            // Circuit completion: Wait at the start station before looping back
            newIsWaiting = true;
            return {
                ...train,
                currentStationIndex: nextStationIndex,
                progress: 0,
                direction: 1, // Continue forward
                isMoving: false,
                isWaiting: true,
                lastStopTime: waitEndTime,
            };
        } else {
            // Standard stop/wait at station
            return {
                ...train,
                currentStationIndex: nextStationIndex,
                progress: 0,
                direction: newDirection, // Keep direction
                isMoving: false,
                isWaiting: true,
                lastStopTime: waitEndTime,
            };
        }
      } else {
        // Still moving within the segment
        newProgress = Math.min(segmentLength, newProgress);
        newStationIndex = currentSegmentIndex;
        newDirection = train.direction;
        newIsMoving = true;
        newIsWaiting = false;
      }

      return {
        ...train,
        currentStationIndex: newStationIndex,
        progress: newProgress,
        direction: newDirection,
        isMoving: newIsMoving,
        isWaiting: newIsWaiting,
        lastStopTime: train.lastStopTime, // Keep last stop time if moving
        totalDistanceTraveled: train.totalDistanceTraveled + (newProgress - train.progress),
      };
    },
    [trains, lines, getSegmentGeometry]
  );

  /** Main simulation tick handler */
  const simulateTick = useCallback((currentTime: number) => {
    setTrains((prevTrains) => {
      const updatedTrains: Record<string, Train> = {};
      let trainsChanged = false;

      Object.keys(prevTrains).forEach((trainId) => {
        const train = prevTrains[trainId];
        const line = lines.find((l) => l.id === train.lineId);

        if (!line) {
            updatedTrains[trainId] = train; // Should not happen if state is consistent
            return;
        }

        let newTrainState: Train;

        if (!train.isMoving && !train.isWaiting) {
            // If stopped and not waiting, it means the simulation was paused or reset.
            newTrainState = train;
        } else if (train.isWaiting) {
            // Check if waiting time is over
            if (currentTime >= train.lastStopTime) {
                // Time to leave the station
                const nextStationIndex = (train.direction === 1)
                    ? Math.min(train.currentStationIndex + 1, line.stationIds.length - 1)
                    : Math.max(train.currentStationIndex - 1, 0);
                
                const nextStationId = line.stationIds[nextStationIndex];
                const currentStationId = line.stationIds[train.currentStationIndex];
                const segment = getSegmentGeometry(currentStationId, nextStationId);
                
                // Reset progress and move flag
                newTrainState = {
                    ...train,
                    progress: 0,
                    isWaiting: false,
                    isMoving: true,
                    lastStopTime: currentTime, // Start timing movement from now
                };
            } else {
                // Still waiting
                newTrainState = { ...train, isWaiting: true, lastStopTime: train.lastStopTime };
            }
        } else {
            // Moving
            newTrainState = updateTrainPosition(trainId, currentTime);
        }
        
        updatedTrains[trainId] = newTrainState;
        if (JSON.stringify(train) !== JSON.stringify(newTrainState)) {
            trainsChanged = true;
        }
      });

      return updatedTrains;
    });
  }, [lines, getSegmentGeometry]);

  // --- Lifecycle Effects ---

  // 1. Simulation Loop Effect
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isSimRunning) {
      const tick = (time: number) => {
        // Simulate every 50ms for smooth visual updates, but logic uses time delta
        simulateTick(time);
      };
      
      // Use requestAnimationFrame for smooth visual updates tied to rendering cycle
      const animationFrameId = requestAnimationFrame(tick);
      intervalRef.current = setInterval(() => {
        // Force a state update check using the current time
        simulateTick(performance.now());
      }, 50); // Check every 50ms
      
      return () => {
        cancelAnimationFrame(animationFrameId);
        clearInterval(intervalRef.current!);
      };
    } else {
        // Clear interval if simulation stops
        if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isSimRunning, simulateTick]);

  // 2. Initial Setup & Cleanup
  useEffect(() => {
    // Reset state on mount/unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // --- Control Handlers ---

  const handleRunPause = useCallback(() => {
    if (lines.length === 0) {
        setToast("No hay líneas para ejecutar.");
        return;
    }
    if (!isSimRunning) {
        setIsSimRunning(true);
        setToast("Ejecutando trenes...");
    } else {
        setIsSimRunning(false);
        setToast("Detenido. Pulsa Ejecutar para reanudar.");
    }
  }, [lines.length, isSimRunning]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLines([]);
    setTrains({});
    setSelectedId(null);
    setGuide(null);
    setIsSimRunning(false);
    setToast("Sistema reiniciado. Estaciones intactas.");
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setGuide(null);
  }, []);

  const deleteLine = useCallback(
    (lineId: string) => {
      setLines((prev) => prev.filter((l) => l.id !== lineId));
      clearSelection();
    },
    [clearSelection],
  );

  // --- Line Creation/Editing Logic ---

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
        const newLine: MetroLine = {
          id: `line-${Date.now()}-${prev.length}`,
          color,
          stationIds: [fromId, toId],
          createdAt: Date.now(),
          closed: false,
          trainId: null,
        };
        
        // Assign initial train T1, T2, or T3 based on line count
        const trainId = `T${(prev.length % 3) + 1}`;
        const initialTrain: Train = {
            id: trainId,
            lineId: newLine.id,
            speed: TRAIN_SPEED,
            currentStationIndex: 0, // Starts at the first station
            progress: 0,
            direction: 1, // Always start moving forward initially
            isMoving: false, // Starts stopped
            isWaiting: true, // Starts waiting at the origin
            lastStopTime: Date.now() + STOP_DURATION, // Pretend it just arrived and is waiting
            totalDistanceTraveled: 0,
        };

        return [
          ...prev,
          { ...newLine, trainId: trainId },
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

  // --- Line Management Menu Logic ---

  const selectLineForMenu = useCallback((lineId: string) => {
    setSelectedId(null);
    setIsEditing(lineId);
    setShowMenu({ lineId, type: 'manage' });
  }, []);

  const handleMenuAction = useCallback((action: 'edit' | 'delete' | 'retire' | 'reassign') => {
    if (!showMenu) return;
    const { lineId, type } = showMenu;
    const line = lines.find((l) => l.id === lineId);
    if (!line) return;

    if (action === 'delete') {
      setLines((prev) => prev.filter((l) => l.id !== lineId));
      setTrains((prev) => {
        const newTrains = { ...prev };
        delete newTrains[trains[lineId]?.id || ''];
        return newTrains;
      });
      setToast("Línea eliminada.");
    } else if (action === 'edit') {
      setIsEditing(lineId);
      setToast("Modo Edición activado. Selecciona un extremo.");
    } else if (action === 'retire') {
      setTrains((prev) => {
        const newTrains = { ...prev };
        delete newTrains[trains[lineId]?.id || ''];
        return newTrains;
      });
      setToast(`Tren ${trains[lineId]?.id || 'Desconocido'} retirado.`);
    } else if (action === 'reassign') {
      // Reassign logic: Use the train ID, but reset its position/state
      const trainId = trains[lineId]?.id || `T${lines.length % 3 + 1}`;
      const newTrain: Train = {
          id: trainId,
          lineId: lineId,
          speed: TRAIN_SPEED,
          currentStationIndex: 0,
          progress: 0,
          direction: 1,
          isMoving: false,
          isWaiting: true,
          lastStopTime: Date.now() + STOP_DURATION,
          totalDistanceTraveled: 0,
      };
      setTrains((prev) => ({ ...prev, [trainId]: newTrain }));
      setToast(`Tren ${trainId} reasignado y detenido en el inicio.`);
    }
  }, [showMenu, lines, trains]);

  // --- Editing State Management ---
  const [editStartId, setEditStartId] = useState<string | null>(null);
  const [editEndId, setEditEndId] = useState<string | null>(null);
  const [editPath, setEditPath] = useState<string[]>([]);

  const startEdit = useCallback((lineId: string) => {
    if (lines.find(l => l.id === lineId)?.closed) {
        setToast("No se puede editar un circuito cerrado.");
        return;
    }
    setIsEditing(lineId);
    setEditStartId(null);
    setEditEndId(null);
    setEditPath([]);
    setToast("Edición de línea activa. Selecciona el primer extremo.");
  }, [lines]);

  const handleEditStationPress = useCallback((stationId: string) => {
    if (!isEditing) return;
    const line = lines.find(l => l.id === isEditing);
    if (!line) return;

    if (!editStartId) {
      // 1. Selecting the first endpoint
      if (stationId === line.stationIds[0] || stationId === line.stationIds[line.stationIds.length - 1]) {
        setEditStartId(stationId);
        setToast(`Extremo inicial seleccionado: ${STATION_BY_ID[stationId].name}. Selecciona el siguiente punto.`);
        return;
      }
      setToast("Debes seleccionar un extremo de la línea para empezar a editar.");
      return;
    }

    if (!editEndId) {
      // 2. Selecting the second endpoint (or extending)
      if (stationId !== editStartId && !line.stationIds.includes(stationId)) {
        // Extension: New station not in the line
        setEditEndId(stationId);
        setEditPath([stationId]);
        setToast(`Extensión añadida. ${STATION_BY_ID[stationId].name} añadido. Selecciona el siguiente punto o finaliza.`);
        return;
      } else if (stationId !== editStartId && line.stationIds.includes(stationId)) {
        // Selecting an existing station (for closing a loop)
        if (line.stationIds.length >= 3 && stationId === line.stationIds[0] && editStartId === line.stationIds[line.stationIds.length - 1]) {
            // Attempting to close a loop (must have >= 3 stations)
            setEditEndId(stationId);
            setEditPath([]); // Path is empty as we are closing
            setToast("Intentando cerrar circuito...");
            // Finalize connection logic here if needed, but for simplicity, we just signal the intent.
            // The actual connection logic will be triggered by the user confirming the edit.
            return;
        } else if (line.stationIds.length < 3) {
            setToast("Se necesitan al menos tres estaciones para cerrar un circuito.");
            return;
        }
        setToast("Estación ya parte de esta línea. Intenta extender o cerrar.");
        return;
      }
    }
    
    // 3. Handling subsequent points (Extension)
    if (editEndId) {
        if (stationId !== editStartId && !line.stationIds.includes(stationId)) {
            // Extend path
            setEditPath(prev => [...prev, stationId]);
            setEditEndId(stationId);
            setToast(`Extensión añadida. ${STATION_BY_ID[stationId].name} añadido. Selecciona el siguiente punto o finaliza.`);
        } else {
            setToast("Selecciona una estación nueva para extender la línea.");
        }
    }
  }, [isEditing, editStartId, editEndId, editPath, lines]);

  const finalizeEdit = useCallback(() => {
    if (!isEditing) return;
    const line = lines.find(l => l.id === isEditing);
    if (!line) return;

    let newStationIds: string[] = line.stationIds;
    let newClosed = false;

    if (editPath.length > 0) {
        // Case 1: Extension occurred
        const newIds = [...line.stationIds];
        const start = newIds[0];
        const end = newIds[newIds.length - 1];
        
        // Determine which end was extended from (the one that was the end)
        const extensionPoint = newIds[newIds.length - 1];
        const newStation = editPath[editPath.length - 1];

        if (extensionPoint === newStation) {
            // Should not happen if logic is correct, but safety check
        } else if (extensionPoint === start) {
            // Extended from the start
            newStationIds = [newStation, ...newIds];
        } else {
            // Extended from the end
            newStationIds = [...newIds, newStation];
        }
        
        // Update line state
        setLines(prev => prev.map(l => 
            l.id === isEditing ? { ...l, stationIds: newStationIds, closed: false } : l
        ));
        setToast(`Línea extendida con éxito. Nueva ruta: ${newStationIds.join(' -> ')}`);

    } else if (editEndId && editStartId && line.stationIds.length >= 3) {
        // Case 2: Closing a loop (editEndId is the closing station, editStartId is the start)
        const closingStation = editEndId;
        const startStation = editStartId;
        
        if (closingStation === startStation) {
            setToast("Error: El circuito debe cerrarse en una estación diferente al inicio.");
            return;
        }
        
        // Check if the closing station is already in the path (shouldn't happen if logic is followed)
        if (line.stationIds.includes(closingStation)) {
            setToast("La estación de cierre ya está en la ruta.");
            return;
        }

        // Create the closed circuit
        const newIds = [...line.stationIds, closingStation];
        setLines(prev => prev.map(l => 
            l.id === isEditing ? { ...l, stationIds: newIds, closed: true } : l
        ));
        setToast(`Circuito cerrado con éxito! Nueva ruta: ${newIds.join(' -> ')}`);
        
    } else {
        setToast("Edición cancelada o no se realizaron cambios válidos.");
    }

    // Reset editing state
    setIsEditing(null);
    setEditStartId(null);
    setEditEndId(null);
    setEditPath([]);
    setShowMenu(null);
    // Re-initialize train position if it was running
    if (trains[isEditing]?.id) {
        setTrains(prev => ({
            ...prev,
            [trains[isEditing].id]: {
                ...trains[isEditing],
                currentStationIndex: 0,
                progress: 0,
                isWaiting: true,
                lastStopTime: Date.now() + STOP_DURATION,
            }
        }));
    }
  }, [isEditing, lines, trains, editPath, editStartId, editEndId]);


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
      isClosed: boolean;
    }[] = [];
    for (const line of lines) {
      const ids = line.stationIds;
      // Open segments
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
          isClosed: false,
        });
      }
      // Closed segment (if applicable)
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
          isClosed: true,
        });
      }
    }
    return out;
  }, [lines]);

  const selectedStation = selectedId ? STATION_BY_ID[selectedId] : null;

  // --- Train Rendering Logic ---
  const renderTrains = useMemo(() => {
    const trainElements: React.ReactNode[] = [];
    return Object.values(trains).map((train) => {
        const line = lines.find(l => l.id === train.lineId);
        if (!line) return;

        const stationIds = line.stationIds;
        const currentStationId = stationIds[train.currentStationIndex];
        const currentStation = STATION_BY_ID[currentStationId];

        // Calculate the current position (P) between two stations (S_prev and S_next)
        let startStation: Station;
        let endStation: Station;
        let segmentLength: number;

        if (train.isWaiting) {
            // Train is waiting at the current station
            startStation = currentStation;
            endStation = currentStation;
            segmentLength = 0;
        } else {
            // Train is moving
            const direction = train.direction;
            const nextIndex = (direction === 1)
                ? Math.min(train.currentStationIndex + 1, stationIds.length - 1)
                : Math.max(train.currentStationIndex - 1, 0);
            
            const nextStationId = stationIds[nextIndex];
            const nextStation = STATION_BY_ID[nextStationId];

            startStation = currentStation;
            endStation = nextStation;
            segmentLength = Math.sqrt(
                (endStation.x - startStation.x) ** 2 + (endStation.y - startStation.y) ** 2
            );
        }

        // Calculate position along the segment
        const ratio = train.progress / segmentLength;
        const x = startStation.x + (endStation.x - startStation.x) * ratio;
        const y = startStation.y + (endStation.y - startStation.y) * ratio;

        // Render the train visualization group
        const trainViz = <TrainVisualization 
            key={train.id} 
            lineColor={line.color} 
            trainId={train.id} 
            isVisible={true} 
        />;

        // Apply transformation to place the train at (x, y)
        return (
            <g key={train.id} transform={`translate(${x}, ${y})`}>
                {trainViz}
            </g>
        );
    });
  }, [trains, lines]);


  // --- UI Rendering ---

  const renderLineMenu = () => {
    if (!showMenu) return null;
    const { lineId, type } = showMenu;
    const line = lines.find(l => l.id === lineId);
    if (!line) return null;

    const train = trains[lineId];
    const trainId = train?.id;

    return (
        <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Gestión de Línea {line.id.split('-')[1]}</Text>
            <View style={styles.menuButtonRow}>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => handleMenuAction('edit')}
                    disabled={isSimRunning}
                >
                    <Text style={styles.menuButtonText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => handleMenuAction('delete')}
                    disabled={isSimRunning}
                >
                    <Text style={styles.menuButtonText}>🗑️ Borrar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => handleMenuAction('retire')}
                    disabled={isSimRunning}
                >
                    <Text style={styles.menuButtonText}>➖ Retirar Tren</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => handleMenuAction('reassign')}
                    disabled={isSimRunning}
                >
                    <Text style={styles.menuButtonText}>🔄 Reasignar Tren</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity 
                style={styles.menuButton} 
                onPress={() => {
                    setShowMenu(null);
                    setIsEditing(null);
                    setEditStartId(null);
                    setEditEndId(null);
                    setEditPath([]);
                }}
                disabled={isSimRunning}
            >
                <Text style={styles.menuButtonText}>❌ Cancelar</Text>
            </TouchableOpacity>
        </View>
    );
  };

  const renderEditMenu = () => {
    if (!isEditing) return null;
    const line = lines.find(l => l.id === isEditing);
    if (!line) return null;

    const canExtend = !line.closed && line.stationIds.length < 8; // Simple check
    const canClose = line.closed && line.stationIds.length >= 3;

    return (
        <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>🛠️ Editando Línea {line.id.split('-')[1]}</Text>
            <Text style={styles.menuSubtitle}>
                {editStartId ? `Inicio: ${STATION_BY_ID[editStartId].name}` : 'Selecciona el primer extremo.'}
            </Text>
            <Text style={styles.menuSubtitle}>
                {editEndId ? `Extremo/Cierre: ${STATION_BY_ID[editEndId].name}` : 'Selecciona el segundo extremo o el punto de extensión.'}
            </Text>
            
            <View style={styles.menuButtonRow}>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={finalizeEdit}
                    disabled={isSimRunning || !editStartId || !editEndId}
                >
                    <Text style={styles.menuButtonText}>✅ Finalizar Edición</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => {
                        setIsEditing(null);
                        setEditStartId(null);
                        setEditEndId(null);
                        setEditPath([]);
                        setShowMenu(null);
                        setToast("Edición cancelada.");
                    }}
                    disabled={isSimRunning}
                >
                    <Text style={styles.menuButtonText}>↩️ Cancelar Edición</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  }


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
        style={styles.board}
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
          
          {/* Lines (Static background representation) */}
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

          {/* Train Visualization (Dynamic) */}
          {renderTrains}

          {/* Hit Areas for Line Deletion (Must be on top of lines) */}
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
              onPress={() => {
                if (!isSimRunning) {
                    // Only allow deletion if simulation is stopped
                    deleteLine(seg.lineId);
                }
              }}
              accessibilityLabel={`Eliminar línea ${seg.lineId}`}
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
          
          {/* Hit Areas for Station Selection */}
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
        </Svg>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <View style={styles.controlRow}>
            <TouchableOpacity 
                style={[styles.controlButton, isSimRunning ? styles.buttonDisabled : {}]} 
                onPress={handleRunPause}
                disabled={!lines.length}
            >
                <Text style={styles.controlButtonText}>
                    {isSimRunning ? "⏸️ Parar" : "▶️ Ejecutar"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.controlButton, !isSimRunning ? {} : styles.buttonDisabled]} 
                onPress={handleReset}
                disabled={isSimRunning}
            >
                <Text style={styles.controlButtonText}>🔄 Reset</Text>
            </TouchableOpacity>
        </View>
        
        {/* Line Management / Editing Menu */}
        {showMenu && renderLineMenu()}
        {isEditing && renderEditMenu()}

        {/* Line Selection Menu (If not in edit mode) */}
        {!isEditing && showMenu && (
            <View style={styles.menuContainer}>
                <Text style={styles.menuTitle}>Gestión de Línea {lines.find(l => l.id === showMenu.lineId)?.id.split('-')[1]}</Text>
                <View style={styles.menuButtonRow}>
                    <TouchableOpacity 
                        style={styles.menuButton} 
                        onPress={() => handleMenuAction('edit')}
                        disabled={isSimRunning}
                    >
                        <Text style={styles.menuButtonText}>✏️ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuButton} 
                        onPress={() => handleMenuAction('delete')}
                        disabled={isSimRunning}
                    >
                        <Text style={styles.menuButtonText}>🗑️ Borrar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuButton} 
                        onPress={() => handleMenuAction('retire')}
                        disabled={isSimRunning}
                    >
                        <Text style={styles.menuButtonText}>➖ Retirar Tren</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuButton} 
                        onPress={() => handleMenuAction('reassign')}
                        disabled={isSimRunning}
                    >
                        <Text style={styles.menuButtonText}>🔄 Reasignar Tren</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => {
                        setShowMenu(null);
                        setIsEditing(null);
                        setEditStartId(null);
                        setEditEndId(null);
                        setEditPath([]);
                    }}
                    disabled={isSimRunning}
                >
                    <Text style={styles.menuButtonText}>❌ Cancelar</Text>
                </TouchableOpacity>
            </View>
        )}
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
    gap: 16,
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
    aspectRatio: 400 / 300, // 4:3 aspect ratio
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  controlPanel: {
    alignItems: 'center',
    width: '100%',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 600,
    marginBottom: 10,
  },
  controlButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1f2937',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 5,
    textAlign: 'center',
  },
  menuButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  menuButton: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
    flex: 1,
    margin: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  menuButtonText: {
    color: '#3730a3',
    fontWeight: '600',
    fontSize: 14,
  }
});
