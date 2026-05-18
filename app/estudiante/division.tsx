import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";
import { getTarifaHogar } from "../../lib/tarifas";

const DAYS = 30;

export default function DivisionEstudiante() {
  const [personas, setPersonas] = useState<string[]>(["Yo"]);
  const [totalKwh, setTotalKwh] = useState(0);
  const [totalCop, setTotalCop] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [tarifa, setTarifa] = useState(821);
  const [empresaEnergia, setEmpresaEnergia] = useState("EPM");
  const [estrato, setEstrato] = useState(3);

  useFocusEffect(
    useCallback(() => {
      cargarConsumo();
    }, []),
  );

  const cargarConsumo = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_energia, estrato")
      .eq("id", user.id)
      .single();

    let tarifaReal = 821;
    if (usuario?.empresa_energia && usuario?.estrato) {
      setEmpresaEnergia(usuario.empresa_energia);
      setEstrato(usuario.estrato);
      tarifaReal = await getTarifaHogar(
        usuario.empresa_energia,
        usuario.estrato,
      );
      setTarifa(tarifaReal);
    }

    const { data: aparatos } = await supabase
      .from("aparatos")
      .select("watts, horas_dia, activo")
      .eq("usuario_id", user.id)
      .eq("activo", true);

    if (aparatos) {
      const kwh = aparatos.reduce(
        (s, a) => s + (a.watts / 1000) * a.horas_dia * DAYS,
        0,
      );
      setTotalKwh(kwh);
      setTotalCop(kwh * tarifaReal);
    }
  };

  const agregarPersona = () => {
    if (personas.length >= 10) {
      Alert.alert(
        "Máximo",
        "Puedes dividir la cuenta entre máximo 10 personas",
      );
      return;
    }
    setShowModal(true);
  };

  const confirmarPersona = () => {
    if (!nuevoNombre.trim()) {
      Alert.alert("Error", "Ingresa el nombre de la persona");
      return;
    }
    setPersonas([...personas, nuevoNombre.trim()]);
    setNuevoNombre("");
    setShowModal(false);
  };

  const eliminarPersona = (i: number) => {
    if (personas.length <= 1) {
      Alert.alert("Mínimo", "Debe haber al menos 1 persona");
      return;
    }
    setPersonas(personas.filter((_, idx) => idx !== i));
  };

  const cada = Math.round(totalCop / personas.length);
  const pct = Math.round(100 / personas.length);

  return (
    <View style={styles.container}>
      <Header showBack title="División de gastos" />
      <ScrollView style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consumo estimado del mes</Text>
          <Text style={styles.totalKwh}>{totalKwh.toFixed(1)} kWh</Text>
          <Text style={styles.totalCop}>
            COP ${Math.round(totalCop).toLocaleString("es-CO")}
          </Text>
          <Text style={styles.hint}>
            Tarifa {empresaEnergia} 2026: ${tarifa}/kWh · Estrato {estrato} ·
            Basado en tus aparatos activos
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>
              Personas ({personas.length}/10)
            </Text>
            {personas.length < 10 && (
              <TouchableOpacity style={styles.addBtn} onPress={agregarPersona}>
                <Text style={styles.addBtnText}>+ Agregar</Text>
              </TouchableOpacity>
            )}
          </View>
          {personas.map((p, i) => (
            <View key={i} style={styles.personRow}>
              <Text style={styles.personIcon}>👤</Text>
              <Text style={styles.personName}>{p}</Text>
              <Text style={styles.personAmount}>
                COP ${cada.toLocaleString("es-CO")}
              </Text>
              {i !== 0 && (
                <TouchableOpacity onPress={() => eliminarPersona(i)}>
                  <Text style={styles.deleteBtn}>🗑</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.myCard}>
          <Text style={styles.myLabel}>Tu parte de la factura</Text>
          <Text style={styles.myAmount}>
            COP ${cada.toLocaleString("es-CO")}
          </Text>
          <Text style={styles.myPct}>Pagas el {pct}% del total</Text>
          <Text style={styles.myIcon}>👤</Text>
        </View>

        <View style={styles.alertCard}>
          <Text style={styles.alertText}>
            💡 El cálculo se basa en el consumo de tus aparatos activos con la
            tarifa {empresaEnergia} 2026 estrato {estrato}.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen de la división</Text>
          {personas.map((p, i) => (
            <View key={i} style={styles.splitRow}>
              <Text style={styles.splitIcon}>👤</Text>
              <View style={styles.splitInfo}>
                <Text style={styles.splitName}>{p}</Text>
                <Text style={styles.splitPct}>{pct}% de la factura</Text>
              </View>
              <Text style={styles.splitAmount}>
                COP ${cada.toLocaleString("es-CO")}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total estimado</Text>
            <Text style={styles.totalAmount}>
              COP ${Math.round(totalCop).toLocaleString("es-CO")}
            </Text>
          </View>
        </View>
      </ScrollView>
      <BottomNav tipo="estudiante" />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Agregar persona</Text>
            <Text style={styles.modalSub}>
              ¿Cómo se llama la persona que comparte el gasto?
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre"
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => {
                  setShowModal(false);
                  setNuevoNombre("");
                }}
              >
                <Text
                  style={{
                    color: "#1a5c3a",
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={confirmarPersona}
              >
                <Text style={styles.btnText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#0f2e1e" },
  totalKwh: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 2,
  },
  totalCop: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2e8b57",
    marginBottom: 6,
  },
  hint: { fontSize: 11, color: "#6b7c74", lineHeight: 16 },
  addBtn: {
    backgroundColor: "#1a5c3a",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  personIcon: { fontSize: 22 },
  personName: { flex: 1, fontSize: 13, fontWeight: "600", color: "#0f2e1e" },
  personAmount: { fontSize: 13, fontWeight: "700", color: "#1a5c3a" },
  deleteBtn: { fontSize: 16, marginLeft: 8 },
  myCard: {
    backgroundColor: "#e8f5ee",
    borderWidth: 1,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  myLabel: { fontSize: 12, color: "#6b7c74", marginBottom: 4 },
  myAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 4,
  },
  myPct: { fontSize: 11, color: "#6b7c74" },
  myIcon: { position: "absolute", right: 16, top: 16, fontSize: 32 },
  alertCard: {
    backgroundColor: "#e8f5ee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  alertText: { fontSize: 12, color: "#0f2e1e", lineHeight: 18 },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  splitIcon: { fontSize: 22 },
  splitInfo: { flex: 1 },
  splitName: { fontSize: 13, fontWeight: "600", color: "#0f2e1e" },
  splitPct: { fontSize: 11, color: "#6b7c74" },
  splitAmount: { fontSize: 13, fontWeight: "700", color: "#1a5c3a" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: { fontSize: 13, fontWeight: "700", color: "#0f2e1e" },
  totalAmount: { fontSize: 14, fontWeight: "900", color: "#1a5c3a" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,46,30,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 8,
  },
  modalSub: { fontSize: 13, color: "#6b7c74", marginBottom: 16 },
  modalInput: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    marginBottom: 16,
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  btnPrimary: {
    flex: 2,
    backgroundColor: "#1a5c3a",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 14,
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
