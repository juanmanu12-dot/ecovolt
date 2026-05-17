import Slider from "@react-native-community/slider";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
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

const TARIFA = 821;
const DAYS = 30;

function fmt(n: number) {
  return "COP $" + Math.round(n).toLocaleString("es-CO");
}
function calcKwh(w: number, h: number, d: number) {
  return (w / 1000) * h * d;
}
function calcCop(w: number, h: number, d: number) {
  return calcKwh(w, h, d) * TARIFA;
}

function generarMensaje(aparatos: any[], activos: any[]) {
  const totalKwh = activos.reduce(
    (s, a) => s + calcKwh(a.watts, a.horas_dia, DAYS),
    0,
  );
  const totalCop = totalKwh * TARIFA;
  const apagados = aparatos.length - activos.length;

  if (activos.length === 0)
    return "✅ Sin consumo activo. Perfecto para maximizar el ahorro.";

  if (activos.length === aparatos.length) {
    const top = [...aparatos].sort(
      (a, b) => b.watts * b.horas_dia - a.watts * a.horas_dia,
    )[0];
    return `⚡ Todos los aparatos activos. Consumo total: ${totalKwh.toFixed(1)} kWh (${fmt(totalCop)}/mes). Considera reducir el uso de ${top?.nombre} que es el de mayor impacto.`;
  }

  if (apagados === 1) {
    const apagado = aparatos.find(
      (a) => !activos.find((ac: any) => ac.id === a.id),
    );
    const ahorro = calcCop(apagado?.watts || 0, apagado?.horas_dia || 0, DAYS);
    return `💡 Apagaste ${apagado?.nombre}. Ahorras ${fmt(ahorro)}/mes. Consumo restante: ${totalKwh.toFixed(1)} kWh (${fmt(totalCop)}/mes).`;
  }

  if (totalCop < 10000)
    return `🌱 Excelente combinación. Solo ${totalKwh.toFixed(1)} kWh al mes (${fmt(totalCop)}). Muy bajo impacto en tu factura.`;
  if (totalCop < 25000)
    return `👍 Buen control. ${totalKwh.toFixed(1)} kWh al mes (${fmt(totalCop)}). Tienes ${apagados} aparato(s) apagado(s), sigue así.`;
  return `⚠️ Consumo moderado con ${activos.length} aparatos activos: ${totalKwh.toFixed(1)} kWh (${fmt(totalCop)}/mes). Apaga ${apagados > 0 ? "más" : "algunos"} aparatos para reducir tu factura.`;
}

export default function Simulador() {
  const [tab, setTab] = useState<"aparato" | "escenario">("aparato");
  const [aparatos, setAparatos] = useState<any[]>([]);
  const [selectedAp, setSelectedAp] = useState<any>(null);
  const [horas, setHoras] = useState(4);
  const [dias, setDias] = useState(30);
  const [activosEscenario, setActivosEscenario] = useState<string[]>([]);
  const [wattsManual, setWattsManual] = useState("");

  useFocusEffect(
    useCallback(() => {
      cargarAparatos();
    }, []),
  );

  const cargarAparatos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("aparatos")
      .select("*")
      .eq("usuario_id", user.id);
    if (data) {
      setAparatos(data);
      setActivosEscenario(
        data.filter((a: any) => a.activo).map((a: any) => a.id),
      );
      if (data.length > 0 && !selectedAp) setSelectedAp(data[0]);
    }
  };

  const toggleEscenario = (id: string) => {
    setActivosEscenario((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const activosData = aparatos.filter((a) => activosEscenario.includes(a.id));
  const totalKwhEscenario = activosData.reduce(
    (s, a) => s + calcKwh(a.watts, a.horas_dia, DAYS),
    0,
  );
  const totalCopEscenario = totalKwhEscenario * TARIFA;

  const w = selectedAp ? selectedAp.watts : parseFloat(wattsManual) || 0;
  const kwh = calcKwh(w, horas, dias);
  const cop = calcCop(w, horas, dias);
  const co2 = (kwh * 0.126).toFixed(2);

  const impact =
    cop < 5000
      ? "💚 Bajo impacto en tu factura."
      : cop < 20000
        ? "🟡 Impacto moderado. Considera reducir el uso."
        : "🔴 Alto consumo. Evalúa reducir horas de uso.";

  return (
    <View style={styles.container}>
      <Header showBack title="Simulador" />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "aparato" && styles.tabActive]}
          onPress={() => setTab("aparato")}
        >
          <Text
            style={[styles.tabText, tab === "aparato" && styles.tabTextActive]}
          >
            Por aparato
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "escenario" && styles.tabActive]}
          onPress={() => setTab("escenario")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "escenario" && styles.tabTextActive,
            ]}
          >
            Escenarios
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body}>
        {tab === "aparato" ? (
          <>
            <Text style={styles.desc}>
              Selecciona un aparato o ingresa la potencia para simular su
              consumo.
            </Text>

            {aparatos.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.inputLabel}>TUS APARATOS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {aparatos.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={[
                        styles.apChip,
                        selectedAp?.id === a.id && styles.apChipActive,
                      ]}
                      onPress={() => {
                        setSelectedAp(a);
                        setWattsManual("");
                      }}
                    >
                      <Text style={styles.apChipIcon}>{a.icono}</Text>
                      <Text
                        style={[
                          styles.apChipText,
                          selectedAp?.id === a.id && styles.apChipTextActive,
                        ]}
                      >
                        {a.nombre}
                      </Text>
                      <Text
                        style={[
                          styles.apChipWatts,
                          selectedAp?.id === a.id && styles.apChipTextActive,
                        ]}
                      >
                        {a.watts}W
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.inputLabel}>
                O INGRESA POTENCIA MANUALMENTE (W)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 60"
                value={wattsManual}
                onChangeText={(v) => {
                  setWattsManual(v);
                  setSelectedAp(null);
                }}
                keyboardType="numeric"
              />

              <View style={styles.sliderSection}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Horas/día</Text>
                  <View style={styles.sliderBadge}>
                    <Text style={styles.sliderBadgeText}>
                      {horas.toFixed(1)}h/día
                    </Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={24}
                  step={0.5}
                  value={horas}
                  onValueChange={setHoras}
                  minimumTrackTintColor="#1a5c3a"
                  maximumTrackTintColor="#b2d8c4"
                  thumbTintColor="#1a5c3a"
                />
                <View style={styles.sliderEnds}>
                  <Text style={styles.sliderEnd}>0.5h</Text>
                  <Text style={styles.sliderEnd}>24h</Text>
                </View>
              </View>

              <View style={styles.sliderSection}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Días/mes</Text>
                  <View style={styles.sliderBadge}>
                    <Text style={styles.sliderBadgeText}>{dias} días</Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={31}
                  step={1}
                  value={dias}
                  onValueChange={setDias}
                  minimumTrackTintColor="#1a5c3a"
                  maximumTrackTintColor="#b2d8c4"
                  thumbTintColor="#1a5c3a"
                />
                <View style={styles.sliderEnds}>
                  <Text style={styles.sliderEnd}>1 día</Text>
                  <Text style={styles.sliderEnd}>31 días</Text>
                </View>
              </View>
            </View>

            {w > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultTop}>
                  <View>
                    <Text style={styles.resultLabel}>CONSUMO ESTIMADO</Text>
                    <Text style={styles.resultAmount}>
                      {kwh.toFixed(1)} kWh
                    </Text>
                    <Text style={styles.resultSub}>
                      {fmt(cop)} / mes · Tarifa 2026
                    </Text>
                  </View>
                  <View style={styles.co2Badge}>
                    <Text style={styles.co2Text}>🌱 {co2} kg CO₂</Text>
                  </View>
                </View>

                <View style={styles.compareBars}>
                  <View style={styles.barCol}>
                    <Text style={styles.barLabel}>Sin control</Text>
                    <View style={styles.barWrap}>
                      <View
                        style={[
                          styles.barFillBefore,
                          {
                            height: Math.min(
                              60,
                              Math.max(4, ((kwh * 1.3) / 50) * 60),
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barVal}>
                      {(kwh * 1.3).toFixed(1)} kWh
                    </Text>
                  </View>
                  <Text style={styles.barArrow}>→</Text>
                  <View style={styles.barCol}>
                    <Text style={styles.barLabel}>Con control</Text>
                    <View style={styles.barWrap}>
                      <View
                        style={[
                          styles.barFillAfter,
                          {
                            height: Math.min(60, Math.max(4, (kwh / 50) * 60)),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barVal}>{kwh.toFixed(1)} kWh</Text>
                  </View>
                  <View style={styles.savingCol}>
                    <Text style={styles.savingLabel}>AHORRO EST.</Text>
                    <Text style={styles.savingKwh}>{fmt(cop * 0.3)}</Text>
                    <Text style={styles.savingSub}>reduciendo 30%</Text>
                  </View>
                </View>

                <View style={styles.impactRow}>
                  <Text style={styles.impactText}>{impact}</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.desc}>
              Activa o desactiva tus aparatos y ve cómo cambia tu consumo total.
            </Text>

            {aparatos.length === 0 ? (
              <View style={styles.alertCard}>
                <Text style={styles.alertText}>
                  📱 Agrega aparatos en Mi Inventario para simular escenarios.
                </Text>
              </View>
            ) : (
              <>
                {aparatos.map((a) => {
                  const isActive = activosEscenario.includes(a.id);
                  const copAp = calcCop(a.watts, a.horas_dia, DAYS);
                  return (
                    <View
                      key={a.id}
                      style={[
                        styles.scenarioCard,
                        !isActive && styles.scenarioCardOff,
                      ]}
                    >
                      <Text style={styles.scenarioEmoji}>{a.icono}</Text>
                      <View style={styles.scenarioInfo}>
                        <Text
                          style={[
                            styles.scenarioName,
                            !isActive && styles.textOff,
                          ]}
                        >
                          {a.nombre}
                        </Text>
                        <Text style={styles.scenarioDesc}>
                          {a.watts}W · {a.horas_dia}h/día · {fmt(copAp)}/mes
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.toggle, !isActive && styles.toggleOff]}
                        onPress={() => toggleEscenario(a.id)}
                      />
                    </View>
                  );
                })}

                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>
                    CONSUMO CON ESTA COMBINACIÓN
                  </Text>
                  <Text style={styles.resultAmount}>
                    {totalKwhEscenario.toFixed(1)} kWh
                  </Text>
                  <Text style={styles.resultSub}>
                    {fmt(totalCopEscenario)} / mes · {activosData.length} de{" "}
                    {aparatos.length} aparatos activos
                  </Text>

                  <View style={styles.impactRow} style={{ marginTop: 12 }}>
                    <Text style={styles.impactText}>
                      {generarMensaje(aparatos, activosData)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <BottomNav tipo="estudiante" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f3" },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#b2d8c4",
  },
  tab: {
    flex: 1,
    padding: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#1a5c3a", backgroundColor: "#e8f5ee" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6b7c74" },
  tabTextActive: { color: "#1a5c3a" },
  body: { padding: 20 },
  desc: { fontSize: 13, color: "#6b7c74", marginBottom: 16, lineHeight: 18 },
  card: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1a5c3a",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 13,
    fontSize: 14,
    marginBottom: 16,
  },
  apChip: {
    alignItems: "center",
    padding: 10,
    marginRight: 8,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 12,
    minWidth: 80,
  },
  apChipActive: { backgroundColor: "#1a5c3a", borderColor: "#1a5c3a" },
  apChipIcon: { fontSize: 24, marginBottom: 4 },
  apChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1a5c3a",
    textAlign: "center",
  },
  apChipTextActive: { color: "#fff" },
  apChipWatts: { fontSize: 9, color: "#6b7c74", marginTop: 2 },
  sliderSection: { marginBottom: 16 },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sliderLabel: { fontSize: 12, fontWeight: "600", color: "#0f2e1e" },
  sliderBadge: {
    backgroundColor: "#1a5c3a",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sliderBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  slider: { width: "100%", height: 40 },
  sliderEnds: { flexDirection: "row", justifyContent: "space-between" },
  sliderEnd: { fontSize: 10, color: "#6b7c74" },
  resultCard: {
    backgroundColor: "#e8f5ee",
    borderWidth: 2,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  resultTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1a5c3a",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 2,
  },
  resultSub: { fontSize: 11, color: "#6b7c74" },
  co2Badge: {
    backgroundColor: "rgba(46,139,87,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  co2Text: { fontSize: 11, fontWeight: "700", color: "#1a5c3a" },
  compareBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 100,
    marginBottom: 14,
  },
  barCol: { alignItems: "center", gap: 4 },
  barArrow: { fontSize: 18, color: "#6b7c74", marginBottom: 28 },
  barWrap: {
    width: 36,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.07)",
    borderRadius: 6,
    justifyContent: "flex-end",
  },
  barFillBefore: { width: "100%", backgroundColor: "#b2d8c4", borderRadius: 4 },
  barFillAfter: { width: "100%", backgroundColor: "#2e8b57", borderRadius: 4 },
  barLabel: { fontSize: 10, fontWeight: "700", color: "#0f2e1e" },
  barVal: { fontSize: 9, color: "#6b7c74" },
  savingCol: { marginLeft: 8, flex: 1 },
  savingLabel: {
    fontSize: 9,
    color: "#6b7c74",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  savingKwh: { fontSize: 13, fontWeight: "700", color: "#1a5c3a" },
  savingSub: { fontSize: 9, color: "#6b7c74" },
  impactRow: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 10,
    padding: 10,
  },
  impactText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f2e1e",
    lineHeight: 18,
  },
  alertCard: { backgroundColor: "#e8f5ee", borderRadius: 10, padding: 12 },
  alertText: { fontSize: 12, color: "#0f2e1e", lineHeight: 18 },
  scenarioCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: "#f4f9f6",
    borderWidth: 1,
    borderColor: "#b2d8c4",
    borderRadius: 12,
    marginBottom: 10,
  },
  scenarioCardOff: { opacity: 0.5 },
  scenarioEmoji: { fontSize: 24 },
  scenarioInfo: { flex: 1 },
  scenarioName: { fontSize: 13, fontWeight: "600", color: "#0f2e1e" },
  scenarioDesc: { fontSize: 11, color: "#6b7c74", marginTop: 2 },
  textOff: { color: "#6b7c74" },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2e8b57",
  },
  toggleOff: { backgroundColor: "#b2d8c4" },
  savingKwh: { fontSize: 13, fontWeight: "700", color: "#1a5c3a" },
});
