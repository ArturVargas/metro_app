import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { StationBoard } from "./src/StationBoard";

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Metro App — A
        </Text>
        <Text style={styles.subtitle}>
          Conecta estaciones con líneas de colores (prompt p-549).
        </Text>
      </View>
      <StationBoard />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: "center",
    gap: 20,
  },
  header: {
    alignItems: "center",
    gap: 8,
    maxWidth: 720,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 22,
  },
});
