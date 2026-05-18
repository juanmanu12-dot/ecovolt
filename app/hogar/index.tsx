import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Carousel from "react-native-reanimated-carousel";
import BottomNav from "../../components/BottomNav";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";
import { getTarifaHogar } from "../../lib/tarifas";

const { width } = Dimensions.get("window");
const DAYS = 30;

const CONSEJOS_GENERALES = [
  {
    icon: "🔌",
    titulo: "Desenchufa lo que no uses",
    desc: "Los aparatos en stand-by pueden representar hasta el 10% de tu factura mensual.",
  },
  {
    icon: "💡",
    titulo: "Cambia a bombillas LED",
    desc: "Consumen hasta 80% menos energía que las incandescentes y duran 10 veces más.",
  },
  {
    icon: "🌡️",
    titulo: "A/C a 24°C es suficiente",
    desc: "Cada grado adicional aumenta el consumo un 8%. 24°C es la temperatura ideal.",
  },
  {
    icon: "🌞",
    titulo: "Aprovecha la luz natural",
    desc: "Abre persianas y cortinas durante el día para reducir el uso de iluminación artificial.",
  },
  {
    icon: "🚿",
    titulo: "Duchas cortas",
    desc: "Reducir 5 minutos tu ducha eléctrica puede ahorrarte hasta COP $22.000 al mes.",
  },
  {
    icon: "🧺",
    titulo: "Lavadora en frío",
    desc: "El 90% de la energía de una lavadora se usa para calentar el agua. Usa agua fría.",
  },
  {
    icon: "🍳",
    titulo: "Tapa las ollas al cocinar",
    desc: "Reduce el tiempo de cocción y el consumo de energía hasta un 25%.",
  },
  {
    icon: "📱",
    titulo: "Carga inteligente",
    desc: "Desconecta los cargadores cuando no los uses. Siguen consumiendo energía enchufados.",
  },
  {
    icon: "🌬️",
    titulo: "Ventilación natural",
    desc: "Antes de encender el A/C abre ventanas por 10 min para renovar el aire.",
  },
  {
    icon: "⏰",
    titulo: "Usa electrodomésticos en horas valle",
    desc: "Entre 10pm y 6am la demanda es menor. Programa lavadoras en ese horario.",
  },
];

function generarConsejosPersonalizados(
  aparatos: any[],
  totalCop: number,
  presupuesto: number,
  tarifa: number,
) {
  const consejos: any[] = [];

  const ac = aparatos.find(
    (a) =>
      a.nombre.toLowerCase().includes("aire") ||
      a.nombre.toLowerCase().includes("acondicionado"),
  );
  if (ac) {
    const ahorro = Math.round((ac.watts / 1000) * tarifa * 30);
    consejos.push({
      icon: "❄️",
      titulo: "Tu A/C es tu mayor gasto",
      desc: `Reduciendo 1 hora diaria tu aire acondicionado ahorrarías COP $${ahorro.toLocaleString("es-CO")} al mes.`,
      tipo: "personalizado",
    });
  }

  const ducha = aparatos.find((a) => a.nombre.toLowerCase().includes("ducha"));
  if (ducha) {
    const ahorro = Math.round((ducha.watts / 1000) * 0.083 * tarifa * 30);
    consejos.push({
      icon: "🚿",
      titulo: "Reduce tu ducha eléctrica",
      desc: `5 minutos menos de ducha al día te ahorrarían COP $${ahorro.toLocaleString("es-CO")} al mes.`,
      tipo: "personalizado",
    });
  }

  const nevera = aparatos.find(
    (a) =>
      a.nombre.toLowerCase().includes("nevera") ||
      a.nombre.toLowerCase().includes("refrigerador"),
  );
  if (nevera) {
    const kwhNevera = (nevera.watts / 1000) * nevera.horas_dia * DAYS;
    const pctNevera =
      totalCop > 0 ? Math.round(((kwhNevera * tarifa) / totalCop) * 100) : 0;
    if (pctNevera > 20) {
      consejos.push({
        icon: "🧊",
        titulo: "Tu nevera consume mucho",
        desc: `Representa el ${pctNevera}% de tu factura. Revisa el sello de la puerta y mantenla alejada de fuentes de calor.`,
        tipo: "personalizado",
      });
    }
  }

  const altosConsumo = aparatos.filter(
    (a) => (a.watts / 1000) * a.horas_dia * DAYS * tarifa > 50000,
  );
  if (altosConsumo.length > 0) {
    consejos.push({
      icon: "⚡",
      titulo: `${altosConsumo.length} aparato(s) de alto consumo`,
      desc: `${altosConsumo.map((a: any) => a.nombre).join(", ")} tienen un impacto alto en tu factura.`,
      tipo: "personalizado",
    });
  }

  if (totalCop > presupuesto) {
    const exceso = Math.round(totalCop - presupuesto);
    consejos.push({
      icon: "⚠️",
      titulo: "Superaste tu presupuesto",
      desc: `Estás COP $${exceso.toLocaleString("es-CO")} por encima de tu presupuesto mensual.`,
      tipo: "alerta",
    });
  }

  return consejos;
}

export default function HogarInicio() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [totalCop, setTotalCop] = useState(0);
  const [presupuesto, setPresupuesto] = useState(250000);
  const [aparatos, setAparatos] = useState<any[]>([]);
  const [consejosPersonalizados, setConsejosPersonalizados] = useState<any[]>(
    [],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [tarifa, setTarifa] = useState(821);
  const [empresaEnergia, setEmpresaEnergia] = useState("EPM");
  const [estrato, setEstrato] = useState(3);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("nombre, presupuesto, empresa_energia, estrato")
      .eq("id", user.id)
      .single();

    if (usuario) {
      setNombre(usuario.nombre || "");
      if (usuario.presupuesto) setPresupuesto(usuario.presupuesto);
      if (usuario.empresa_energia) setEmpresaEnergia(usuario.empresa_energia);
      if (usuario.estrato) setEstrato(usuario.estrato);

      if (usuario.empresa_energia && usuario.estrato) {
        const t = await getTarifaHogar(
          usuario.empresa_energia,
          usuario.estrato,
        );
        setTarifa(t);
      }
    }

    const { data: aparatosData } = await supabase
      .from("aparatos")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("activo", true);

    if (aparatosData) {
      setAparatos(aparatosData);
      const tarifaActual = tarifa;
      const total = aparatosData.reduce(
        (s, a) => s + (a.watts / 1000) * a.horas_dia * DAYS * tarifaActual,
        0,
      );
      setTotalCop(total);
      setConsejosPersonalizados(
        generarConsejosPersonalizados(
          aparatosData,
          total,
          usuario?.presupuesto || 250000,
          tarifaActual,
        ),
      );
    }
  };

  const pct = Math.min(100, Math.round((totalCop / presupuesto) * 100));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Header />
        <ScrollView style={styles.body}>
          <View style={styles.heroCard}>
            <View>
              <Text style={styles.heroTitle}>¡Hola, {nombre || "hogar"}!</Text>
              <Text style={styles.heroSub}>
                Controla tu consumo,{"\n"}ahorra en grande.
              </Text>
            </View>
            <Text style={styles.heroIcon}>🏠</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              Tu consumo personal <Text style={styles.cardSub}>Este mes</Text>
            </Text>
            <Text style={styles.cardAmount}>
              COP ${Math.round(totalCop).toLocaleString("es-CO")}
            </Text>
            <Text style={styles.cardKwh}>
              Tarifa {empresaEnergia} · Estrato {estrato} · ${tarifa}/kWh
            </Text>
            <Text style={styles.cardOk}>
              {totalCop <= presupuesto
                ? "✅ Dentro del presupuesto"
                : "⚠️ Superaste el presupuesto"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Presupuesto mensual</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: pct > 90 ? "#e05252" : "#2e8b57",
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>
                COP ${Math.round(totalCop).toLocaleString("es-CO")} / $
                {presupuesto.toLocaleString("es-CO")}
              </Text>
              <Text style={styles.progressText}>{pct}%</Text>
            </View>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push("/hogar/aparatos")}
            >
              <Text style={styles.quickIcon}>🔌</Text>
              <Text style={styles.quickLabel}>Aparatos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push("/hogar/tarifas")}
            >
              <Text style={styles.quickIcon}>💲</Text>
              <Text style={styles.quickLabel}>Tarifas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push("/hogar/reportes")}
            >
              <Text style={styles.quickIcon}>📊</Text>
              <Text style={styles.quickLabel}>Reportes</Text>
            </TouchableOpacity>
          </View>

          {consejosPersonalizados.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>💡 Consejos para ti</Text>
              {consejosPersonalizados.map((c, i) => (
                <View
                  key={i}
                  style={[
                    styles.consejoCard,
                    c.tipo === "alerta" && styles.consejoAlerta,
                  ]}
                >
                  <Text style={styles.consejoIcon}>{c.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.consejoTitulo}>{c.titulo}</Text>
                    <Text style={styles.consejoDesc}>{c.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📚 Consejos generales</Text>
            <Carousel
              data={CONSEJOS_GENERALES}
              renderItem={({ item }: any) => (
                <View style={styles.carouselCard}>
                  <Text style={styles.carouselIcon}>{item.icon}</Text>
                  <Text style={styles.carouselTitulo}>{item.titulo}</Text>
                  <Text style={styles.carouselDesc}>{item.desc}</Text>
                </View>
              )}
              width={width - 80}
              height={160}
              loop={true}
              autoPlay={true}
              autoPlayInterval={4000}
              onProgressChange={(_, index) => setActiveIndex(Math.round(index))}
            />
            <View style={styles.carouselNav}>
              <Text style={styles.carouselArrow}>‹ desliza ›</Text>
              <View style={styles.dotsRow}>
                {CONSEJOS_GENERALES.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === activeIndex && styles.dotActive]}
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
        <BottomNav tipo="hogar" />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f3" },
  body: { padding: 20 },
  heroCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e8f5ee",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 4,
  },
  heroSub: { fontSize: 13, color: "#6b7c74", lineHeight: 18 },
  heroIcon: { fontSize: 48 },
  card: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f2e1e",
    marginBottom: 6,
  },
  cardSub: { fontSize: 11, fontWeight: "400", color: "#6b7c74" },
  cardAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 4,
  },
  cardKwh: { fontSize: 11, color: "#6b7c74", marginBottom: 4 },
  cardOk: { fontSize: 12, color: "#6b7c74" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f2e1e",
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#b2d8c4",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressText: { fontSize: 11, color: "#6b7c74" },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  quickCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    padding: 14,
    backgroundColor: "#f4f9f6",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 16,
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 11, fontWeight: "600", color: "#1a5c3a" },
  consejoCard: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    backgroundColor: "#e8f5ee",
    borderRadius: 10,
    marginBottom: 8,
  },
  consejoAlerta: { backgroundColor: "#fde8e8" },
  consejoIcon: { fontSize: 22 },
  consejoTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f2e1e",
    marginBottom: 2,
  },
  consejoDesc: { fontSize: 12, color: "#6b7c74", lineHeight: 17 },
  carouselCard: {
    backgroundColor: "#1a5c3a",
    borderRadius: 16,
    padding: 20,
    height: 160,
  },
  carouselIcon: { fontSize: 32, marginBottom: 10 },
  carouselTitulo: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },
  carouselDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },
  carouselNav: { alignItems: "center", marginTop: 10 },
  carouselArrow: { fontSize: 12, color: "#6b7c74", marginBottom: 6 },
  dotsRow: { flexDirection: "row", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#b2d8c4" },
  dotActive: { width: 16, borderRadius: 3, backgroundColor: "#1a5c3a" },
});
