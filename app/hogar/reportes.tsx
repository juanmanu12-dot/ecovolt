import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useFocusEffect } from "expo-router";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { BarChart } from "react-native-chart-kit";

const TARIFA = 721;
const DAYS = 30;
const screenWidth = Dimensions.get("window").width;

function fmt(n: number) {
  return "COP $" + Math.round(n).toLocaleString("es-CO");
}

export default function Reportes() {
  const [aparatos, setAparatos] = useState<any[]>([]);
  const [totalKwh, setTotalKwh] = useState(0);
  const [totalCop, setTotalCop] = useState(0);

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
    const { data } = await supabase
      .from("aparatos")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("activo", true);
    if (data) {
      setAparatos(data);
      const kwh = data.reduce(
        (s, a) => s + (a.watts / 1000) * a.horas_dia * DAYS,
        0,
      );
      setTotalKwh(kwh);
      setTotalCop(kwh * TARIFA);
    }
  };

  const top = [...aparatos]
    .sort((a, b) => {
      const kwhA = (a.watts / 1000) * a.horas_dia * DAYS;
      const kwhB = (b.watts / 1000) * b.horas_dia * DAYS;
      return kwhB - kwhA;
    })
    .slice(0, 5);

  const chartData = {
    labels: top.map((a) => a.nombre.slice(0, 6)),
    datasets: [
      {
        data: top.map((a) =>
          parseFloat(((a.watts / 1000) * a.horas_dia * DAYS).toFixed(1)),
        ),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Reportes" />
      <ScrollView style={styles.body}>
        <Text style={styles.sub}>Tu consumo · Este mes</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statVal}>{totalKwh.toFixed(1)} kWh</Text>
            <Text style={styles.statLbl}>Consumo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statVal}>${Math.round(totalCop / 1000)}k</Text>
            <Text style={styles.statLbl}>Gasto</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔌</Text>
            <Text style={styles.statVal}>{aparatos.length}</Text>
            <Text style={styles.statLbl}>Aparatos</Text>
          </View>
        </View>

        {top.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Consumo por aparato (kWh/mes)
            </Text>
            <BarChart
              data={chartData}
              width={screenWidth - 80}
              height={200}
              yAxisLabel=""
              yAxisSuffix=" kWh"
              chartConfig={{
                backgroundColor: "#f4f9f6",
                backgroundGradientFrom: "#f4f9f6",
                backgroundGradientTo: "#f4f9f6",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(26, 92, 58, ${opacity})`,
                labelColor: () => "#6b7c74",
                style: { borderRadius: 16 },
              }}
              style={{ borderRadius: 16 }}
            />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mayor consumo</Text>
          {top.map((a, i) => {
            const kwh = (a.watts / 1000) * a.horas_dia * DAYS;
            const pct = totalKwh > 0 ? ((kwh / totalKwh) * 100).toFixed(0) : 0;
            return (
              <View key={a.id} style={styles.aparatoRow}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>{a.icono}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aparatoName}>{a.nombre}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                </View>
                <Text style={styles.aparatoPct}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {top.length > 0 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertText}>
              📋 Reduciendo 1h/día el uso de {top[0]?.nombre} podrías ahorrar{" "}
              {fmt(Math.round((top[0]?.watts / 1000) * TARIFA * 30))} al mes.
            </Text>
          </View>
        )}

        {aparatos.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Agrega aparatos en la sección de inventario para ver tu reporte.
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomNav tipo="hogar" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f3" },
  body: { padding: 20 },
  sub: { fontSize: 13, color: "#6b7c74", marginBottom: 16 },
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
  statVal: { fontSize: 12, fontWeight: "700", color: "#0f2e1e" },
  statLbl: { fontSize: 10, color: "#6b7c74", marginTop: 1 },
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
  aparatoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aparatoName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f2e1e",
    marginBottom: 4,
  },
  barTrack: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#2e8b57", borderRadius: 3 },
  aparatoPct: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1a5c3a",
    minWidth: 40,
    textAlign: "right",
  },
  alertCard: {
    backgroundColor: "#e8f5ee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  alertText: { fontSize: 12, color: "#0f2e1e", lineHeight: 18 },
  emptyCard: {
    backgroundColor: "#f4f9f6",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#6b7c74",
    textAlign: "center",
    lineHeight: 20,
  },
});
