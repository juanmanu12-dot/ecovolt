import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import BottomNav from "../../components/BottomNav";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

const COLORES = [
  "#4a90d9",
  "#2e8b57",
  "#d4b24a",
  "#e09052",
  "#9b59b6",
  "#e05252",
];
const TARIFAS: Record<string, number> = {
  EPM: 821,
  Codensa: 812,
  ESSA: 795,
  Electricaribe: 841,
  EMCALI: 808,
  EdeQ: 820,
  CHEC: 824,
  CENS: 801,
};

function fmt(n: number) {
  return "COP $" + Math.round(n).toLocaleString("es-CO");
}

function DonutChart({
  sectores,
  total,
  periodo,
}: {
  sectores: any[];
  total: number;
  periodo: string;
}) {
  const R = 72;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  const label =
    periodo === "dia"
      ? "kWh Hoy"
      : periodo === "semana"
        ? "kWh Semana"
        : "kWh Total";

  return (
    <View style={{ alignItems: "center", marginBottom: 20 }}>
      <Svg width={200} height={200} viewBox="0 0 200 200">
        <G rotation="-90" origin="100, 100">
          {total === 0 ? (
            <Circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke="#eee"
              strokeWidth={strokeWidth}
            />
          ) : (
            sectores.map((s, i) => {
              const pct = s._kwh / total;
              const dash = pct * circumference;
              const el = (
                <Circle
                  key={s.id}
                  cx="100"
                  cy="100"
                  r={R}
                  fill="none"
                  stroke={COLORES[i % COLORES.length]}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return el;
            })
          )}
        </G>
        <SvgText
          x="100"
          y="93"
          textAnchor="middle"
          fontSize="22"
          fontWeight="bold"
          fill="#0f2e1e"
        >
          {total > 0 ? total.toFixed(1) : "—"}
        </SvgText>
        <SvgText
          x="100"
          y="112"
          textAnchor="middle"
          fontSize="11"
          fill="#6b7c74"
        >
          {label}
        </SvgText>
      </Svg>
    </View>
  );
}

export default function Areas() {
  const [sectores, setSectores] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes">("mes");
  const [tarifa, setTarifa] = useState(821);
  const [infoText, setInfoText] = useState("Datos del mes en curso.");

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
      .select("empresa_energia")
      .eq("id", user.id)
      .single();
    if (usuario?.empresa_energia)
      setTarifa(TARIFAS[usuario.empresa_energia] || 821);

    const { data } = await supabase
      .from("sectores")
      .select("*")
      .eq("usuario_id", user.id);
    if (data) setSectores(data);
  };

  const factor =
    periodo === "dia" ? 1 / 30 : periodo === "semana" ? 1 / 4.33 : 1;

  const sectoresConKwh = sectores.map((s) => ({
    ...s,
    _kwh: (s.kwh_mes || 0) * factor,
  }));

  const totalKwh = sectoresConKwh.reduce((s, x) => s + x._kwh, 0);

  const setPeriodoYTexto = (p: "dia" | "semana" | "mes") => {
    setPeriodo(p);
    if (p === "dia") setInfoText("Datos estimados del día.");
    else if (p === "semana") setInfoText("Datos estimados de la semana.");
    else setInfoText("Datos del mes en curso.");
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Consumo por áreas" />

      <View style={styles.periodoTabs}>
        {(["dia", "semana", "mes"] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodoTab,
              periodo === p && styles.periodoTabActive,
            ]}
            onPress={() => setPeriodoYTexto(p)}
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
        <DonutChart
          sectores={sectoresConKwh}
          total={totalKwh}
          periodo={periodo}
        />

        {sectores.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay sectores registrados.</Text>
            <Text style={styles.emptySub}>
              Agrega sectores desde la pantalla de inicio.
            </Text>
          </View>
        ) : (
          sectoresConKwh.map((s, i) => {
            const cop = s._kwh * tarifa;
            const pct =
              totalKwh > 0 ? Math.round((s._kwh / totalKwh) * 100) : 0;
            return (
              <View key={s.id} style={styles.areaCard}>
                <View
                  style={[
                    styles.areaIconBox,
                    { backgroundColor: COLORES[i % COLORES.length] + "22" },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{s.icono}</Text>
                </View>
                <View style={styles.areaInfo}>
                  <Text style={styles.areaNombre}>{s.nombre}</Text>
                  <Text style={styles.areaKwh}>{s._kwh.toFixed(1)} kWh</Text>
                  <View style={styles.areaBarTrack}>
                    <View
                      style={[
                        styles.areaBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: COLORES[i % COLORES.length],
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text
                  style={[
                    styles.areaPct,
                    { color: COLORES[i % COLORES.length] },
                  ]}
                >
                  {pct}%
                </Text>
              </View>
            );
          })
        )}

        <View style={styles.alertCard}>
          <Text style={styles.alertText}>💡 {infoText}</Text>
        </View>
      </ScrollView>
      <BottomNav tipo="empresa" />
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
  emptyBox: { alignItems: "center", padding: 40 },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7c74",
    marginBottom: 4,
  },
  emptySub: { fontSize: 12, color: "#6b7c74", textAlign: "center" },
  areaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f4f9f6",
    borderWidth: 1,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  areaIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  areaInfo: { flex: 1 },
  areaNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f2e1e",
    marginBottom: 2,
  },
  areaKwh: { fontSize: 12, color: "#6b7c74", marginBottom: 6 },
  areaBarTrack: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  areaBarFill: { height: "100%", borderRadius: 3 },
  areaPct: {
    fontSize: 18,
    fontWeight: "900",
    minWidth: 44,
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
