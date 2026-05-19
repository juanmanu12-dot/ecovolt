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
import { getTarifaEmpresa } from "../../lib/tarifas";

function fmt(n: number) {
  return "COP $" + Math.round(n).toLocaleString("es-CO");
}

export default function Costos() {
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes">("mes");
  const [sectores, setSectores] = useState<any[]>([]);
  const [tarifa, setTarifa] = useState(1141);
  const [meta, setMeta] = useState(2800000);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [nuevaMeta, setNuevaMeta] = useState("");
  const [empresaEnergia, setEmpresaEnergia] = useState("EPM");

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, []),
  );

  const cargarDatos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_energia, tipo_activos, meta_mensual")
      .eq("id", user.id)
      .single();

    if (usuario?.empresa_energia) {
      setEmpresaEnergia(usuario.empresa_energia);
      const t = await getTarifaEmpresa(
        usuario.empresa_energia,
        usuario.tipo_activos || "activos_empresa",
      );
      setTarifa(t);
      if (usuario.meta_mensual) setMeta(usuario.meta_mensual);
    }

    const { data: sects } = await supabase
      .from("sectores")
      .select("*")
      .eq("usuario_id", user.id);
    if (sects) setSectores(sects);
  };

  const guardarMeta = async (nuevaMetaVal: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("usuarios")
      .update({ meta_mensual: nuevaMetaVal })
      .eq("id", user.id);
    setMeta(nuevaMetaVal);
  };

  const factor =
    periodo === "dia" ? 1 / 30 : periodo === "semana" ? 1 / 4.33 : 1;
  const metaPeriodo =
    periodo === "mes" ? meta : periodo === "semana" ? meta / 4.33 : meta / 30;

  const totalKwh = sectores.reduce((s, x) => s + (x.kwh_mes || 0) * factor, 0);
  const totalCop = totalKwh * tarifa;
  const pctMeta =
    metaPeriodo > 0 ? Math.round((totalCop / metaPeriodo) * 100) : 0;
  const overMeta = totalCop > metaPeriodo;

  const topSector = [...sectores].sort((a, b) => b.kwh_mes - a.kwh_mes)[0];
  const ahorroTop = topSector
    ? Math.round(topSector.kwh_mes * 0.1 * factor * tarifa)
    : 0;

  return (
    <View style={styles.container}>
      <Header showBack title="Control de costos" />

      <View style={styles.periodoTabs}>
        {(["dia", "semana", "mes"] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodoTab,
              periodo === p && styles.periodoTabActive,
            ]}
            onPress={() => setPeriodo(p)}
          >
            <Text
              style={[
                styles.periodoTabText,
                periodo === p && styles.periodoTabTextActive,
              ]}
            >
              {p === "dia" ? "Día" : p === "semana" ? "Semana" : "Mes"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body}>
        <View style={styles.gastoCard}>
          <Text style={styles.gastoLabel}>
            {periodo === "dia"
              ? "Gasto estimado hoy"
              : periodo === "semana"
                ? "Gasto estimado semana"
                : "Gasto mensual"}
          </Text>
          <Text style={styles.gastoAmount}>{fmt(totalCop)}</Text>
          <Text
            style={[
              styles.gastoDelta,
              { color: overMeta ? "#e05252" : "#2e8b57" },
            ]}
          >
            {overMeta
              ? `↑ ${pctMeta - 100}% sobre la meta`
              : `✓ ${100 - pctMeta}% por debajo de la meta`}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.metaLabel}>
                Meta{" "}
                {periodo === "mes"
                  ? "mensual"
                  : periodo === "semana"
                    ? "semanal"
                    : "diaria"}
              </Text>
              <Text style={styles.metaVal}>{fmt(metaPeriodo)}</Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setNuevaMeta(String(meta));
                setShowMetaModal(true);
              }}
            >
              <Text style={styles.editBtnText}>✏ Editar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, pctMeta)}%`,
                  backgroundColor: overMeta
                    ? "#e05252"
                    : pctMeta > 80
                      ? "#e09052"
                      : "#2e8b57",
                },
              ]}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <Text style={styles.barLabel}>0</Text>
            <Text
              style={[
                styles.barLabel,
                { color: overMeta ? "#e05252" : "#2e8b57", fontWeight: "700" },
              ]}
            >
              {pctMeta}%
            </Text>
            <Text style={styles.barLabel}>
              {fmt(metaPeriodo).replace("COP ", "")}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Comparación ·{" "}
            {periodo === "mes"
              ? "vs mes anterior"
              : periodo === "semana"
                ? "vs semana anterior"
                : "vs ayer"}
          </Text>
          <View style={styles.compareGrid}>
            <View>
              <Text style={styles.compareLabel}>Período anterior</Text>
              <Text style={styles.compareVal}>{fmt(totalCop * 0.9)}</Text>
            </View>
            <View>
              <Text style={styles.compareLabel}>Período actual</Text>
              <Text
                style={[
                  styles.compareVal,
                  { color: overMeta ? "#e05252" : "#2e8b57" },
                ]}
              >
                {fmt(totalCop)}
              </Text>
            </View>
          </View>
          <View style={styles.compareDelta}>
            <Text style={[styles.compareDeltaText, { color: "#e05252" }]}>
              ↑ {fmt(totalCop * 0.1)} (10%) vs período anterior
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Desglose por sector</Text>
          {sectores.length === 0 ? (
            <Text style={styles.emptyText}>No hay sectores registrados.</Text>
          ) : (
            sectores.map((s, i) => {
              const kwhS = (s.kwh_mes || 0) * factor;
              const copS = kwhS * tarifa;
              const pct =
                totalKwh > 0 ? Math.round((kwhS / totalKwh) * 100) : 0;
              const COLORES = [
                "#4a90d9",
                "#2e8b57",
                "#d4b24a",
                "#e09052",
                "#9b59b6",
                "#e05252",
              ];
              return (
                <View key={s.id} style={styles.desgItem}>
                  <View
                    style={[
                      styles.desgDot,
                      { backgroundColor: COLORES[i % COLORES.length] },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.desgNombre}>{s.nombre}</Text>
                    <Text style={styles.desgPct}>
                      {pct}% · {kwhS.toFixed(1)} kWh
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.desgCop,
                      { color: COLORES[i % COLORES.length] },
                    ]}
                  >
                    {fmt(copS)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {topSector && (
          <View style={styles.alertCard}>
            <Text style={styles.alertText}>
              📊 Reduciendo el 10% del consumo en {topSector.nombre} podrías
              ahorrar {fmt(ahorroTop)}{" "}
              {periodo === "mes"
                ? "al mes"
                : periodo === "semana"
                  ? "esta semana"
                  : "hoy"}
              .
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomNav tipo="empresa" />

      <Modal visible={showMetaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar meta mensual</Text>
            <Text style={styles.modalSub}>
              Define cuánto quieres gastar máximo en energía cada mes.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. 2800000"
              value={nuevaMeta}
              onChangeText={(v) => setNuevaMeta(v.replace(/\./g, ""))}
              keyboardType="numeric"
            />
            {nuevaMeta ? (
              <Text
                style={{
                  fontSize: 13,
                  color: "#1a5c3a",
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                COP ${parseInt(nuevaMeta).toLocaleString("es-CO")}
              </Text>
            ) : null}
            <Text style={styles.modalSub}>Sugerencias rápidas:</Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {[2000000, 2500000, 2800000, 3500000].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={styles.presetBtn}
                  onPress={() => setNuevaMeta(String(v))}
                >
                  <Text style={styles.presetBtnText}>
                    ${(v / 1000000).toFixed(1)}M
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setShowMetaModal(false)}
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
                onPress={() => {
                  const v = parseFloat(nuevaMeta);
                  if (!v || v <= 0) {
                    Alert.alert("Error", "Ingresa una meta válida");
                    return;
                  }
                  guardarMeta(v);
                  setShowMetaModal(false);
                }}
              >
                <Text style={styles.btnText}>Guardar meta</Text>
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
  periodoTabs: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 8 },
  periodoTab: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    backgroundColor: "#f4f9f6",
    alignItems: "center",
  },
  periodoTabActive: { backgroundColor: "#1a5c3a", borderColor: "#1a5c3a" },
  periodoTabText: { fontSize: 13, fontWeight: "600", color: "#6b7c74" },
  periodoTabTextActive: { color: "#fff" },
  body: { padding: 16 },
  gastoCard: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  gastoLabel: { fontSize: 12, color: "#6b7c74", marginBottom: 4 },
  gastoAmount: {
    fontSize: 30,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 4,
  },
  gastoDelta: { fontSize: 12, fontWeight: "600" },
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f2e1e",
    marginBottom: 12,
  },
  metaLabel: { fontSize: 12, color: "#6b7c74", marginBottom: 2 },
  metaVal: { fontSize: 18, fontWeight: "700", color: "#0f2e1e" },
  editBtn: {
    backgroundColor: "#e8f5ee",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  editBtnText: { fontSize: 12, fontWeight: "700", color: "#1a5c3a" },
  barTrack: {
    height: 10,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 4,
  },
  barFill: { height: "100%", borderRadius: 5 },
  barLabel: { fontSize: 11, color: "#6b7c74" },
  compareGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  compareLabel: { fontSize: 10, color: "#6b7c74", marginBottom: 4 },
  compareVal: { fontSize: 14, fontWeight: "700", color: "#0f2e1e" },
  compareDelta: { paddingTop: 6, borderTopWidth: 1, borderTopColor: "#b2d8c4" },
  compareDeltaText: { fontSize: 13, fontWeight: "700" },
  desgItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  desgDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  desgNombre: { fontSize: 12, fontWeight: "600", color: "#0f2e1e" },
  desgPct: { fontSize: 11, color: "#6b7c74", marginTop: 2 },
  desgCop: { fontSize: 12, fontWeight: "700" },
  emptyText: {
    fontSize: 13,
    color: "#6b7c74",
    textAlign: "center",
    padding: 10,
  },
  alertCard: {
    backgroundColor: "#e8f5ee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  alertText: { fontSize: 12, color: "#0f2e1e", lineHeight: 18 },
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
  modalSub: { fontSize: 13, color: "#6b7c74", marginBottom: 12 },
  modalInput: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    marginBottom: 8,
  },
  presetBtn: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presetBtnText: { fontSize: 12, fontWeight: "600", color: "#1a5c3a" },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
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
