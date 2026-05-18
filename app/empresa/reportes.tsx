import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { G, Rect } from "react-native-svg";
import BottomNav from "../../components/BottomNav";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";
import { getTarifaEmpresa } from "../../lib/tarifas";

const { width } = Dimensions.get("window");

function fmt(n: number) {
  return "COP $" + Math.round(n).toLocaleString("es-CO");
}

const MESES_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export default function ReportesEmpresa() {
  const [sectores, setSectores] = useState<any[]>([]);
  const [tarifa, setTarifa] = useState(1141);
  const [meta, setMeta] = useState(2800000);
  const [mesIdx, setMesIdx] = useState(new Date().getMonth());
  const [empresaEnergia, setEmpresaEnergia] = useState("EPM");
  const [historial, setHistorial] = useState<any[]>([]);

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
      .select("empresa_energia, tipo_activos")
      .eq("id", user.id)
      .single();

    if (usuario?.empresa_energia) {
      setEmpresaEnergia(usuario.empresa_energia);
      const t = await getTarifaEmpresa(
        usuario.empresa_energia,
        usuario.tipo_activos || "activos_empresa",
      );
      setTarifa(t);
    }

    const { data: sects } = await supabase
      .from("sectores")
      .select("*")
      .eq("usuario_id", user.id);
    if (sects) {
      setSectores(sects);
      const totalKwh = sects.reduce((s, x) => s + (x.kwh_mes || 0), 0);
      const totalCop = totalKwh * tarifa;
      const hist = MESES_LABELS.map((label, i) => {
        const variacion = 0.85 + Math.random() * 0.3;
        const kwh = totalKwh * variacion;
        const cop = kwh * tarifa;
        return {
          label,
          kwh: Math.round(kwh),
          cop: Math.round(cop),
          sobre: cop > meta,
        };
      });
      setHistorial(hist);
    }
  };

  const totalKwh = sectores.reduce((s, x) => s + (x.kwh_mes || 0), 0);
  const totalCop = totalKwh * tarifa;
  const pctMeta = meta > 0 ? Math.round((totalCop / meta) * 100) : 0;
  const overMeta = totalCop > meta;
  const mesActual = historial[mesIdx];
  const mesAnterior = historial[mesIdx > 0 ? mesIdx - 1 : 0];
  const topSector = [...sectores].sort((a, b) => b.kwh_mes - a.kwh_mes)[0];

  const maxKwh =
    historial.length > 0 ? Math.max(...historial.map((m) => m.kwh)) : 1;
  const chartW = width - 72;
  const barW = chartW / Math.max(historial.length, 1) - 4;

  return (
    <View style={styles.container}>
      <Header showBack title="Reporte ejecutivo" />
      <ScrollView style={styles.body}>
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthNav}
            onPress={() => setMesIdx(Math.max(0, mesIdx - 1))}
            disabled={mesIdx === 0}
          >
            <Text
              style={[styles.monthNavText, mesIdx === 0 && { opacity: 0.3 }]}
            >
              ‹
            </Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MESES_LABELS[mesIdx]} 2026</Text>
          <TouchableOpacity
            style={styles.monthNav}
            onPress={() =>
              setMesIdx(Math.min(MESES_LABELS.length - 1, mesIdx + 1))
            }
            disabled={mesIdx === MESES_LABELS.length - 1}
          >
            <Text
              style={[
                styles.monthNavText,
                mesIdx === MESES_LABELS.length - 1 && { opacity: 0.3 },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statVal}>
              {mesActual
                ? mesActual.kwh.toLocaleString("es-CO")
                : totalKwh.toLocaleString("es-CO")}{" "}
              kWh
            </Text>
            <Text style={styles.statLbl}>Consumo</Text>
            {mesAnterior && mesActual && (
              <Text
                style={[
                  styles.statDelta,
                  {
                    color:
                      mesActual.kwh > mesAnterior.kwh ? "#e05252" : "#2e8b57",
                  },
                ]}
              >
                {mesActual.kwh > mesAnterior.kwh ? "↑" : "↓"}{" "}
                {Math.abs(
                  Math.round(
                    ((mesActual.kwh - mesAnterior.kwh) / mesAnterior.kwh) * 100,
                  ),
                )}
                %
              </Text>
            )}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statVal} numberOfLines={1}>
              ${Math.round((mesActual?.cop || totalCop) / 1000)}k
            </Text>
            <Text style={styles.statLbl}>Gasto</Text>
            {mesAnterior && mesActual && (
              <Text
                style={[
                  styles.statDelta,
                  {
                    color:
                      mesActual.cop > mesAnterior.cop ? "#e05252" : "#2e8b57",
                  },
                ]}
              >
                {mesActual.cop > mesAnterior.cop ? "↑" : "↓"}{" "}
                {Math.abs(
                  Math.round(
                    ((mesActual.cop - mesAnterior.cop) / mesAnterior.cop) * 100,
                  ),
                )}
                %
              </Text>
            )}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>{pctMeta > 100 ? "🔴" : "✅"}</Text>
            <Text
              style={[
                styles.statVal,
                { color: pctMeta > 100 ? "#e05252" : "#2e8b57" },
              ]}
            >
              {pctMeta}%
            </Text>
            <Text style={styles.statLbl}>vs Meta</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen del mes</Text>
          {sectores.length === 0 ? (
            <Text style={styles.emptyText}>No hay sectores registrados.</Text>
          ) : (
            [
              `Consumo total: ${totalKwh.toLocaleString("es-CO")} kWh`,
              `Gasto total: ${fmt(totalCop)}`,
              pctMeta > 100
                ? `⚠️ Se superó la meta en un ${pctMeta - 100}%.`
                : `✅ Primer mes dentro de la meta.`,
              topSector
                ? `${topSector.nombre} es el sector de mayor consumo (${Math.round((topSector.kwh_mes / totalKwh) * 100)}%).`
                : "",
            ]
              .filter(Boolean)
              .map((b, i) => (
                <Text key={i} style={styles.bullet}>
                  • {b}
                </Text>
              ))
          )}
        </View>

        {historial.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Evolución de consumo (kWh)</Text>
            <Svg width={chartW} height={100} style={{ overflow: "visible" }}>
              {historial.map((m, i) => {
                const bH = Math.max(4, (m.kwh / maxKwh) * 80);
                const x = i * (barW + 4);
                const y = 80 - bH;
                const isActive = i === mesIdx;
                return (
                  <G key={i} onPress={() => setMesIdx(i)}>
                    <Rect
                      x={x}
                      y={y}
                      width={barW}
                      height={bH}
                      rx={3}
                      fill={
                        isActive ? "#1a5c3a" : m.sobre ? "#e05252" : "#b2d8c4"
                      }
                    />
                  </G>
                );
              })}
            </Svg>
            <View style={styles.chartLabels}>
              {historial.map((m, i) => (
                <Text
                  key={i}
                  style={[
                    styles.chartLabel,
                    i === mesIdx && styles.chartLabelActive,
                  ]}
                  onPress={() => setMesIdx(i)}
                >
                  {m.label}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Historial mensual</Text>
          <View style={styles.histHeader}>
            <Text style={styles.histHeaderText}>Mes</Text>
            <Text style={styles.histHeaderText}>kWh</Text>
            <Text style={styles.histHeaderText}>Gasto</Text>
            <Text style={styles.histHeaderText}>Meta</Text>
          </View>
          {[...historial].reverse().map((m, i) => {
            const ri = historial.length - 1 - i;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.histRow, ri === mesIdx && styles.histRowActive]}
                onPress={() => setMesIdx(ri)}
              >
                <Text style={styles.histMes}>{m.label}</Text>
                <Text style={styles.histKwh}>
                  {m.kwh.toLocaleString("es-CO")}
                </Text>
                <Text
                  style={[
                    styles.histCop,
                    { color: m.sobre ? "#e05252" : "#2e8b57" },
                  ]}
                >
                  ${Math.round(m.cop / 1000)}k
                </Text>
                <Text
                  style={[
                    styles.histBadge,
                    { color: m.sobre ? "#e05252" : "#2e8b57" },
                  ]}
                >
                  {m.sobre ? "↑" : "✓"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.alertCard}>
          <Text style={styles.alertText}>
            🤖 En {MESES_LABELS[mesIdx]} 2026,{" "}
            {overMeta
              ? `el gasto superó la meta. Optimiza producción e iluminación.`
              : `el consumo estuvo dentro de la meta. ¡Sigue así!`}
            {topSector
              ? ` Reduciendo 10% en ${topSector.nombre} ahorras ${fmt(Math.round(topSector.kwh_mes * 0.1 * tarifa))} al mes.`
              : ""}
          </Text>
        </View>

        <TouchableOpacity style={styles.btnPrimary}>
          <Text style={styles.btnText}>⬇ Descargar reporte (PDF)</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav tipo="empresa" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f3" },
  body: { padding: 16 },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e8f5ee",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  monthNav: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    alignItems: "center",
    justifyContent: "center",
  },
  monthNavText: { fontSize: 20, color: "#1a5c3a", fontWeight: "700" },
  monthLabel: { fontSize: 18, fontWeight: "900", color: "#1a5c3a" },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#f4f9f6",
    borderWidth: 1,
    borderColor: "#b2d8c4",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  statIcon: { fontSize: 16, marginBottom: 4 },
  statVal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f2e1e",
    textAlign: "center",
  },
  statLbl: { fontSize: 10, color: "#6b7c74", marginTop: 1 },
  statDelta: { fontSize: 10, marginTop: 2, fontWeight: "600" },
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
  bullet: { fontSize: 12, color: "#0f2e1e", lineHeight: 22 },
  emptyText: {
    fontSize: 13,
    color: "#6b7c74",
    textAlign: "center",
    padding: 10,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  chartLabel: { fontSize: 9, color: "#6b7c74", textAlign: "center", flex: 1 },
  chartLabelActive: { color: "#1a5c3a", fontWeight: "700" },
  histHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#b2d8c4",
    marginBottom: 4,
  },
  histHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6b7c74",
    textTransform: "uppercase",
    flex: 1,
    textAlign: "center",
  },
  histRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
  },
  histRowActive: {
    backgroundColor: "#e8f5ee",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  histMes: { fontSize: 11, fontWeight: "600", color: "#0f2e1e", flex: 1 },
  histKwh: { fontSize: 11, color: "#0f2e1e", flex: 1, textAlign: "center" },
  histCop: { fontSize: 11, fontWeight: "600", flex: 1, textAlign: "center" },
  histBadge: { fontSize: 14, fontWeight: "700", flex: 1, textAlign: "center" },
  alertCard: {
    backgroundColor: "#e8f5ee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  alertText: { fontSize: 12, color: "#0f2e1e", lineHeight: 18 },
  btnPrimary: {
    backgroundColor: "#1a5c3a",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
