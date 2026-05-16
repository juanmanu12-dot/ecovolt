import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TipoCuenta() {
  const router = useRouter();

  const seleccionar = (tipo: string) => {
    router.push({ pathname: "/auth/registro", params: { tipo } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Evocolt</Text>
        <Text style={styles.sub}>Tu aliado para ahorrar energía</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>¿Cómo usas{"\n"}la energía?</Text>
        <Text style={styles.desc}>
          Escoge tu perfil para personalizar tu experiencia.
        </Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => seleccionar("hogar")}
        >
          <Text style={styles.cardIcon}>🏠</Text>
          <View>
            <Text style={styles.cardTitle}>Hogar</Text>
            <Text style={styles.cardDesc}>
              Controla el consumo de tu casa o apartamento
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => seleccionar("estudiante")}
        >
          <Text style={styles.cardIcon}>🎓</Text>
          <View>
            <Text style={styles.cardTitle}>Estudiante</Text>
            <Text style={styles.cardDesc}>
              Gestiona tus gastos en habitación universitaria
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => seleccionar("empresa")}
        >
          <Text style={styles.cardIcon}>🏢</Text>
          <View>
            <Text style={styles.cardTitle}>Empresa</Text>
            <Text style={styles.cardDesc}>
              Monitorea el consumo industrial por sectores
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f3" },
  header: {
    backgroundColor: "#e8f5ee",
    alignItems: "center",
    paddingVertical: 40,
    paddingTop: 60,
  },
  brand: {
    fontFamily: "serif",
    fontSize: 28,
    fontWeight: "700",
    color: "#1a5c3a",
  },
  sub: { fontSize: 13, color: "#6b7c74", marginTop: 4 },
  body: { padding: 24 },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 8,
    lineHeight: 34,
  },
  desc: { fontSize: 13, color: "#6b7c74", marginBottom: 24 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "#f4f9f6",
  },
  cardIcon: {
    fontSize: 28,
    width: 48,
    height: 48,
    textAlign: "center",
    lineHeight: 48,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1a5c3a" },
  cardDesc: { fontSize: 12, color: "#6b7c74", marginTop: 2, maxWidth: 220 },
});
