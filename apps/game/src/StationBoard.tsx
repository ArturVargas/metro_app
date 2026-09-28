import { StyleSheet, View } from "react-native";
import Svg, { Circle, Polygon, Rect } from "react-native-svg";

type StationShape = "circle" | "triangle" | "square";

type Station = {
  id: string;
  name: string;
  shape: StationShape;
  x: number;
  y: number;
};

const VIEW_BOX = "0 0 400 300";
const STATION_SIZE = 14;

const SHAPE_LABEL: Record<StationShape, string> = {
  circle: "círculo",
  triangle: "triángulo",
  square: "cuadrado",
};

/** Fixture de ocho estaciones fijas del baseline; sin interacción. */
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

function StationMark({ station }: { station: Station }) {
  const label = `${station.name}, ${SHAPE_LABEL[station.shape]}`;
  const common = {
    accessibilityLabel: label,
    accessible: true as const,
    fill: "#1a1a1a",
  };

  switch (station.shape) {
    case "circle":
      return (
        <Circle
          cx={station.x}
          cy={station.y}
          r={STATION_SIZE}
          {...common}
        />
      );
    case "triangle": {
      const h = STATION_SIZE * 1.8;
      const half = h / Math.sqrt(3);
      const points = [
        `${station.x},${station.y - h * 0.6}`,
        `${station.x - half},${station.y + h * 0.4}`,
        `${station.x + half},${station.y + h * 0.4}`,
      ].join(" ");
      return <Polygon points={points} {...common} />;
    }
    case "square":
      return (
        <Rect
          x={station.x - STATION_SIZE}
          y={station.y - STATION_SIZE}
          width={STATION_SIZE * 2}
          height={STATION_SIZE * 2}
          {...common}
        />
      );
  }
}

export function StationBoard(): React.JSX.Element {
  return (
    <View style={styles.board} accessibilityLabel="Tablero de estaciones">
      <Svg
        width="100%"
        height="100%"
        viewBox={VIEW_BOX}
        preserveAspectRatio="xMidYMid meet"
      >
        <Rect
          x={0}
          y={0}
          width={400}
          height={300}
          fill="#f4f6f8"
          stroke="#d0d7de"
          strokeWidth={2}
        />
        {STATIONS.map((station) => (
          <StationMark key={station.id} station={station} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: "100%",
    maxWidth: 720,
    aspectRatio: 400 / 300,
    alignSelf: "center",
  },
});
