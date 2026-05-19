import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
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
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function fmt(n: number) {
  return "COP $" + Math.round(n).toLocaleString("es-CO");
}

export default function ReportesEmpresa() {
  const [historial, setHistorial] = useState<any[]>([]);
  const [mesSelIdx, setMesSelIdx] = useState(0);
  const [tarifa, setTarifa] = useState(1141);
  const [meta, setMeta] = useState(2800000);
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [empresaEnergia, setEmpresaEnergia] = useState("EPM");
  const [kwhActual, setKwhActual] = useState(0);
  const [copActual, setCopActual] = useState(0);
  const [sectoresActuales, setSectoresActuales] = useState<any[]>([]);

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
      .select("empresa_energia, tipo_activos, nombre_empresa, meta_mensual")
      .eq("id", user.id)
      .single();

    let tarifaActual = 1141;
    let metaActual = 2800000;

    if (usuario) {
      setNombreEmpresa(usuario.nombre_empresa || "Mi Empresa");
      setEmpresaEnergia(usuario.empresa_energia || "EPM");
      if (usuario.meta_mensual) {
        setMeta(usuario.meta_mensual);
        metaActual = usuario.meta_mensual;
      }
      if (usuario.empresa_energia && usuario.tipo_activos) {
        tarifaActual = await getTarifaEmpresa(
          usuario.empresa_energia,
          usuario.tipo_activos,
        );
        setTarifa(tarifaActual);
      }
    }

    const { data: sects } = await supabase
      .from("sectores")
      .select("*")
      .eq("usuario_id", user.id);
    if (sects) {
      setSectoresActuales(sects);
      const kwh = sects.reduce((s, x) => s + (x.kwh_mes || 0), 0);
      const cop = kwh * tarifaActual;
      setKwhActual(kwh);
      setCopActual(cop);
    }

    const { data: hist } = await supabase
      .from("historial_empresa")
      .select("*")
      .eq("usuario_id", user.id)
      .order("anio", { ascending: false })
      .order("mes", { ascending: false });

    const ahora = new Date();
    const mesHoy = ahora.getMonth();
    const anioHoy = ahora.getFullYear();

    const kwh = sects?.reduce((s, x) => s + (x.kwh_mes || 0), 0) || 0;
    const cop = kwh * tarifaActual;

    const mesEnCurso = {
      id: "actual",
      mes: mesHoy,
      anio: anioHoy,
      total_kwh: kwh,
      total_cop: cop,
      meta: metaActual,
      sectores: sects || [],
      cerrado: false,
    };

    if (hist && hist.length > 0) {
      const histSinActual = hist.filter(
        (h) => !(h.mes === mesHoy && h.anio === anioHoy && !h.cerrado),
      );
      const mesesCerrados = hist.filter((h) => h.cerrado);
      setHistorial([mesEnCurso, ...mesesCerrados]);
    } else {
      setHistorial([mesEnCurso]);
    }
    setMesSelIdx(0);
  };

  const eliminarRegistro = (id: string, mes: number, anio: number) => {
    if (id === "actual") {
      Alert.alert("Error", "No puedes eliminar el mes en curso.");
      return;
    }
    Alert.alert(
      "Eliminar registro",
      `¿Eliminar el historial de ${MESES[mes]} ${anio}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await supabase.from("historial_empresa").delete().eq("id", id);
            cargarDatos();
          },
        },
      ],
    );
  };

  const mesActual = historial[mesSelIdx];
  const mesAnterior = historial[mesSelIdx + 1];

  const pctMeta =
    mesActual && mesActual.meta > 0
      ? Math.round((mesActual.total_cop / mesActual.meta) * 100)
      : 0;
  const overMeta = mesActual && mesActual.total_cop > mesActual.meta;

  const deltaCop =
    mesActual && mesAnterior && mesAnterior.total_cop > 0
      ? Math.round(
          ((mesActual.total_cop - mesAnterior.total_cop) /
            mesAnterior.total_cop) *
            100,
        )
      : 0;

  const deltaKwh =
    mesActual && mesAnterior && mesAnterior.total_kwh > 0
      ? Math.round(
          ((mesActual.total_kwh - mesAnterior.total_kwh) /
            mesAnterior.total_kwh) *
            100,
        )
      : 0;

  const topSector = mesActual?.sectores
    ? [...mesActual.sectores].sort(
        (a: any, b: any) => (b.kwh_mes || 0) - (a.kwh_mes || 0),
      )[0]
    : null;

  const maxKwh =
    historial.length > 0
      ? Math.max(...historial.map((m) => m.total_kwh || 0), 1)
      : 1;
  const chartW = width - 72;
  const barW = Math.min(32, chartW / Math.max(historial.length, 1) - 4);

  const generarPDF = (idx: number | "todos") => {
    if (idx === "todos") {
      if (historial.length === 0) {
        Alert.alert("Sin datos", "No hay historial disponible para exportar.");
        return;
      }
      Alert.alert(
        "📄 Reporte completo",
        `Se generaría un PDF con ${historial.length} mes(es) de historial de ${nombreEmpresa}.\n\nEsta función estará disponible en la versión de producción.`,
        [{ text: "Entendido" }],
      );
    } else {
      const m = historial[idx];
      if (!m) return;
      Alert.alert(
        "📄 Reporte mensual",
        `Reporte de ${MESES[m.mes]} ${m.anio}:\n\n• Consumo: ${m.total_kwh.toFixed(1)} kWh\n• Gasto: ${fmt(m.total_cop)}\n• Meta: ${fmt(m.meta)}\n• Resultado: ${m.total_cop > m.meta ? "⚠️ Sobre meta" : "✅ Dentro de meta"}`,
        [{ text: "Entendido" }],
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Reporte ejecutivo" />
      <ScrollView style={styles.body}>
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthNav}
            onPress={() =>
              setMesSelIdx(Math.min(historial.length - 1, mesSelIdx + 1))
            }
            disabled={mesSelIdx >= historial.length - 1}
          >
            <Text
              style={[
                styles.monthNavText,
                mesSelIdx >= historial.length - 1 && { opacity: 0.3 },
              ]}
            >
              ‹
            </Text>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.monthLabel}>
              {mesActual
                ? `${MESES[mesActual.mes]} ${mesActual.anio}`
                : "Sin datos"}
            </Text>
            {mesActual && !mesActual.cerrado && (
              <Text style={styles.monthSub}>
                📍 Mes en curso · Datos en tiempo real
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.monthNav}
            onPress={() => setMesSelIdx(Math.max(0, mesSelIdx - 1))}
            disabled={mesSelIdx === 0}
          >
            <Text
              style={[styles.monthNavText, mesSelIdx === 0 && { opacity: 0.3 }]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statVal} numberOfLines={1}>
              {mesActual ? mesActual.total_kwh.toFixed(0) : 0} kWh
            </Text>
            <Text style={styles.statLbl}>Consumo</Text>
            {mesAnterior && mesAnterior.total_kwh > 0 && (
              <Text
                style={[
                  styles.statDelta,
                  { color: deltaKwh > 0 ? "#e05252" : "#2e8b57" },
                ]}
              >
                {deltaKwh > 0 ? "↑" : "↓"} {Math.abs(deltaKwh)}% vs mes ant.
              </Text>
            )}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statVal} numberOfLines={1}>
              ${Math.round((mesActual?.total_cop || 0) / 1000)}k
            </Text>
            <Text style={styles.statLbl}>Gasto</Text>
            {mesAnterior && mesAnterior.total_cop > 0 && (
              <Text
                style={[
                  styles.statDelta,
                  { color: deltaCop > 0 ? "#e05252" : "#2e8b57" },
                ]}
              >
                {deltaCop > 0 ? "↑" : "↓"} {Math.abs(deltaCop)}% vs mes ant.
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

        {mesActual && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Resumen de {MESES[mesActual.mes]} {mesActual.anio}
              {!mesActual.cerrado && (
                <Text style={{ fontSize: 11, color: "#2e8b57" }}>
                  {" "}
                  · En curso
                </Text>
              )}
            </Text>
            <Text style={styles.bullet}>
              • Consumo total: {mesActual.total_kwh.toFixed(1)} kWh
            </Text>
            <Text style={styles.bullet}>
              • Gasto total: {fmt(mesActual.total_cop)}
            </Text>
            <Text style={styles.bullet}>• Meta: {fmt(mesActual.meta)}</Text>
            <Text style={styles.bullet}>
              •{" "}
              {overMeta
                ? `⚠️ Superó la meta en un ${pctMeta - 100}%`
                : `✅ Dentro de la meta (${pctMeta}%)`}
            </Text>
            {mesAnterior && mesAnterior.total_cop > 0 && (
              <Text style={styles.bullet}>
                •{" "}
                {deltaCop > 0
                  ? `↑ Aumentó ${deltaCop}%`
                  : `↓ Redujo ${Math.abs(deltaCop)}%`}{" "}
                vs {MESES[mesAnterior.mes]} {mesAnterior.anio}
              </Text>
            )}
            {topSector && topSector.kwh_mes > 0 && (
              <Text style={styles.bullet}>
                • {topSector.nombre} fue el sector de mayor consumo
              </Text>
            )}
          </View>
        )}

        {historial.length > 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Evolución de consumo (kWh)</Text>
            <Svg width={chartW} height={100} style={{ overflow: "visible" }}>
              {[...historial].reverse().map((m, i) => {
                const bH = Math.max(4, ((m.total_kwh || 0) / maxKwh) * 80);
                const x = i * (barW + 4);
                const y = 80 - bH;
                const isActive = historial.length - 1 - i === mesSelIdx;
                return (
                  <G
                    key={i}
                    onPress={() => setMesSelIdx(historial.length - 1 - i)}
                  >
                    <Rect
                      x={x}
                      y={y}
                      width={barW}
                      height={bH}
                      rx={3}
                      fill={
                        isActive
                          ? "#1a5c3a"
                          : !m.cerrado
                            ? "#7ee8a2"
                            : m.total_cop > m.meta
                              ? "#e05252"
                              : "#b2d8c4"
                      }
                    />
                  </G>
                );
              })}
            </Svg>
            <View style={styles.chartLabels}>
              {[...historial].reverse().map((m, i) => (
                <Text
                  key={i}
                  style={[
                    styles.chartLabel,
                    historial.length - 1 - i === mesSelIdx &&
                      styles.chartLabelActive,
                  ]}
                  onPress={() => setMesSelIdx(historial.length - 1 - i)}
                >
                  {MESES[m.mes].substring(0, 3)}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Historial mensual</Text>
          {historial.length === 0 ? (
            <Text style={styles.emptyText}>No hay historial disponible.</Text>
          ) : (
            <>
              <View style={styles.histHeader}>
                <Text style={[styles.histHeaderText, { flex: 1.5 }]}>Mes</Text>
                <Text style={styles.histHeaderText}>kWh</Text>
                <Text style={styles.histHeaderText}>Gasto</Text>
                <Text style={styles.histHeaderText}>Meta</Text>
                <Text style={styles.histHeaderText}>⬇</Text>
                <Text style={styles.histHeaderText}>🗑</Text>
              </View>
              {historial.map((m, i) => {
                const pct =
                  m.meta > 0 ? Math.round((m.total_cop / m.meta) * 100) : 0;
                const sobre = m.total_cop > m.meta;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.histRow,
                      i === mesSelIdx && styles.histRowActive,
                    ]}
                    onPress={() => setMesSelIdx(i)}
                  >
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.histMes}>
                        {MESES[m.mes].substring(0, 3)} {m.anio}
                      </Text>
                      {!m.cerrado && (
                        <Text style={styles.histCurso}>📍 En curso</Text>
                      )}
                    </View>
                    <Text style={styles.histKwh}>{m.total_kwh.toFixed(0)}</Text>
                    <Text
                      style={[
                        styles.histCop,
                        { color: sobre ? "#e05252" : "#2e8b57" },
                      ]}
                    >
                      ${Math.round(m.total_cop / 1000)}k
                    </Text>
                    <Text
                      style={[
                        styles.histBadge,
                        { color: sobre ? "#e05252" : "#2e8b57" },
                      ]}
                    >
                      {pct}%
                    </Text>
                    <TouchableOpacity onPress={() => generarPDF(i)}>
                      <Text style={styles.actionBtn}>⬇</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => eliminarRegistro(m.id, m.mes, m.anio)}
                    >
                      <Text
                        style={[
                          styles.actionBtn,
                          { color: m.id === "actual" ? "#b2d8c4" : "#e05252" },
                        ]}
                      >
                        🗑
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>

        {mesActual && (
          <View style={styles.alertCard}>
            <Text style={styles.alertText}>
              🤖{" "}
              {overMeta
                ? `En ${MESES[mesActual.mes]} el gasto superó la meta. ${topSector && topSector.kwh_mes > 0 ? `Optimiza el sector ${topSector.nombre} para reducir costos.` : "Revisa tus sectores de mayor consumo."}`
                : `En ${MESES[mesActual.mes]} el consumo estuvo dentro de la meta. ¡Sigue así!`}
              {topSector && topSector.kwh_mes > 0 && !overMeta
                ? ` Reduciendo 10% en ${topSector.nombre} ahorras ${fmt(Math.round((topSector.kwh_mes || 0) * 0.1 * tarifa))} al mes.`
                : ""}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 30 }}>
          <TouchableOpacity
            style={[styles.btnPrimary, { flex: 1 }]}
            onPress={() => generarPDF(mesSelIdx)}
          >
            <Text style={styles.btnText}>⬇ PDF este mes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnSecondary, { flex: 1 }]}
            onPress={() => generarPDF("todos")}
          >
            <Text style={styles.btnSecondaryText}>⬇ PDF todos</Text>
          </TouchableOpacity>
        </View>
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
  monthSub: { fontSize: 10, color: "#2e8b57", marginTop: 2 },
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
  statDelta: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: "600",
    textAlign: "center",
  },
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
  bullet: { fontSize: 12, color: "#0f2e1e", lineHeight: 24 },
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
  histMes: { fontSize: 11, fontWeight: "600", color: "#0f2e1e" },
  histCurso: { fontSize: 9, color: "#2e8b57", fontWeight: "600" },
  histKwh: { fontSize: 11, color: "#0f2e1e", flex: 1, textAlign: "center" },
  histCop: { fontSize: 11, fontWeight: "600", flex: 1, textAlign: "center" },
  histBadge: { fontSize: 11, fontWeight: "700", flex: 1, textAlign: "center" },
  actionBtn: {
    fontSize: 16,
    textAlign: "center",
    flex: 1,
    paddingHorizontal: 4,
  },
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
    padding: 14,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  btnSecondaryText: { color: "#1a5c3a", fontSize: 13, fontWeight: "700" },
});
