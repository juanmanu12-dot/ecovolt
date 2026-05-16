import { View, Text, StyleSheet, ScrollView } from "react-native";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";

export default function Tarifas() {
  return (
    <View style={styles.container}>
      <Header showBack title="Tarifas" />
      <ScrollView style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tarifa actual</Text>
          <Text style={styles.tarifa}>
            $721.53 <Text style={styles.tarifaSub}>/ kWh</Text>
          </Text>
          <Text style={styles.tarifaInfo}>EPM · Mayo 2024</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Estrato</Text>
          <Text style={styles.estratoVal}>Estrato 3</Text>
          <Text style={styles.estratoInfo}>Subsidio aplicado: 20%</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Comparación por estrato</Text>
          {[
            { estrato: 1, tarifa: 450, subsidio: "50%" },
            { estrato: 2, tarifa: 580, subsidio: "35%" },
            { estrato: 3, tarifa: 721, subsidio: "20%" },
            { estrato: 4, tarifa: 850, subsidio: "0%" },
            { estrato: 5, tarifa: 980, subsidio: "0%" },
            { estrato: 6, tarifa: 1100, subsidio: "0%" },
          ].map((e) => (
            <View
              key={e.estrato}
              style={[
                styles.estratoRow,
                e.estrato === 3 && styles.estratoRowActive,
              ]}
            >
              <Text style={styles.estratoNum}>Estrato {e.estrato}</Text>
              <Text style={styles.estratoTarifa}>${e.tarifa}/kWh</Text>
              <Text style={styles.estratoSubsidio}>{e.subsidio}</Text>
            </View>
          ))}
        </View>

        <View style={styles.alertCard}>
          <Text style={styles.alertText}>
            💡 Las tarifas se actualizan mensualmente según la regulación de la
            CREG.
          </Text>
        </View>
      </ScrollView>
      <BottomNav tipo="hogar" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f3" },
  body: { padding: 20 },
  card: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f2e1e",
    marginBottom: 12,
  },
  tarifa: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 4,
  },
  tarifaSub: { fontSize: 13, color: "#6b7c74", fontWeight: "400" },
  tarifaInfo: { fontSize: 12, color: "#6b7c74" },
  estratoVal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f2e1e",
    marginBottom: 4,
  },
  estratoInfo: { fontSize: 12, color: "#6b7c74" },
  estratoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  estratoRowActive: {
    backgroundColor: "#e8f5ee",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  estratoNum: { fontSize: 13, fontWeight: "600", color: "#0f2e1e", flex: 1 },
  estratoTarifa: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a5c3a",
    flex: 1,
    textAlign: "center",
  },
  estratoSubsidio: {
    fontSize: 12,
    color: "#6b7c74",
    flex: 1,
    textAlign: "right",
  },
  alertCard: {
    backgroundColor: "#e8f5ee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  alertText: { fontSize: 12, color: "#0f2e1e", lineHeight: 18 },
});
