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

const { width } = Dimensions.get("window");
const TARIFA = 721;
const DAYS = 30;

const CONSEJOS_ESTUDIANTE = [
  {
    icon: "💻",
    titulo: "Modo ahorro en laptop",
    desc: "Activa el modo de ahorro de energía. Reduce el consumo hasta un 30% en uso normal.",
  },
  {
    icon: "📱",
    titulo: "Desconecta el cargador",
    desc: "El cargador consume hasta 2W aunque el celular ya esté al 100%. ¡Desenchúfalo!",
  },
  {
    icon: "💡",
    titulo: "Cambia a LEDs",
    desc: "Una bombilla LED consume hasta 80% menos que una incandescente.",
  },
  {
    icon: "🌀",
    titulo: "Ventilador inteligente",
    desc: "Un ventilador solo es útil si estás presente. Apágalo aunque salgas 5 minutos.",
  },
  {
    icon: "☀️",
    titulo: "Luz natural al estudiar",
    desc: "Ubícate cerca de una ventana en el día. Ahorras horas de iluminación artificial.",
  },
  {
    icon: "🌱",
    titulo: "Streaming en SD",
    desc: "Ver video en HD consume 3× más energía que en SD. Baja la calidad cuando no importa.",
  },
  {
    icon: "✈️",
    titulo: "Modo avión al dormir",
    desc: "Activa el modo avión mientras duermes. Ahorra batería y reduce la carga de red.",
  },
  {
    icon: "🌡️",
    titulo: "24°C es suficiente",
    desc: "Cada grado adicional de A/C sube el consumo un 8%. Mantén 24°C.",
  },
];

function generarConsejosPersonalizados(
  aparatos: any[],
  totalCop: number,
  presupuesto: number,
) {
  const consejos: any[] = [];

  const laptop = aparatos.find(
    (a) =>
      a.nombre.toLowerCase().includes("laptop") ||
      a.nombre.toLowerCase().includes("computador"),
  );
  if (laptop) {
    const ahorro = Math.round((laptop.watts / 1000) * 0.3 * TARIFA * 30);
    consejos.push({
      icon: "💻",
      titulo: "Activa modo ahorro en tu laptop",
      desc: `Reduciendo un 30% el consumo de tu laptop ahorrarías COP $${ahorro.toLocaleString("es-CO")} al mes.`,
      tipo: "personalizado",
    });
  }

  const ac = aparatos.find((a) => a.nombre.toLowerCase().includes("aire"));
  if (ac) {
    const ahorro = Math.round((ac.watts / 1000) * TARIFA * 30);
    consejos.push({
      icon: "❄️",
      titulo: "Tu A/C consume mucho",
      desc: `Reduciendo 1 hora diaria ahorrarías COP $${ahorro.toLocaleString("es-CO")} al mes.`,
      tipo: "personalizado",
    });
  }

  if (totalCop > presupuesto) {
    const exceso = Math.round(totalCop - presupuesto);
    consejos.push({
      icon: "⚠️",
      titulo: "Superaste tu presupuesto",
      desc: `Estás COP $${exceso.toLocaleString("es-CO")} por encima de tu presupuesto semanal.`,
      tipo: "alerta",
    });
  }

  return consejos;
}

export default function EstudianteInicio() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [totalCop, setTotalCop] = useState(0);
  const [presupuesto, setPresupuesto] = useState(15000);
  const [aparatos, setAparatos] = useState<any[]>([]);
  const [consejosPersonalizados, setConsejosPersonalizados] = useState<any[]>(
    [],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [factura, setFactura] = useState(180000);
  const [personas, setPersonas] = useState(3);

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
      .select("nombre, presupuesto")
      .eq("id", user.id)
      .single();

    if (usuario) {
      setNombre(usuario.nombre);
      if (usuario.presupuesto) setPresupuesto(usuario.presupuesto);
    }

    const { data: aparatosData } = await supabase
      .from("aparatos")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("activo", true);

    if (aparatosData) {
      setAparatos(aparatosData);
      const total = aparatosData.reduce(
        (s, a) => s + (a.watts / 1000) * a.horas_dia * DAYS * TARIFA,
        0,
      );
      setTotalCop(total);
      setConsejosPersonalizados(
        generarConsejosPersonalizados(
          aparatosData,
          total,
          usuario?.presupuesto || 15000,
        ),
      );
    }
  };

  const pct = Math.min(100, Math.round((totalCop / presupuesto) * 100));
  const miParte = Math.round(factura / personas);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Header />
        <ScrollView style={styles.body}>
          <View style={styles.heroCard}>
            <View>
              <Text style={styles.heroTitle}>
                ¡Hola, {nombre || "estudiante"}!
              </Text>
              <Text style={styles.heroSub}>
                Controla tu consumo,{"\n"}ahorra en grande.
              </Text>
            </View>
            <Text style={styles.heroIcon}>🎓</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              Tu consumo personal <Text style={styles.cardSub}>Este mes</Text>
            </Text>
            <Text style={styles.cardAmount}>
              COP ${Math.round(totalCop).toLocaleString("es-CO")}
            </Text>
            <Text style={styles.cardOk}>
              {totalCop <= presupuesto
                ? "✅ Dentro del presupuesto 😊"
                : "⚠️ Superaste el presupuesto"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Presupuesto semanal</Text>
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

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tu parte de la factura</Text>
            <Text style={styles.cardSub2}>
              Compartida entre {personas} personas
            </Text>
            <Text style={styles.cardAmount}>
              COP ${miParte.toLocaleString("es-CO")}
            </Text>
            <Text style={styles.cardSub2}>
              de COP ${factura.toLocaleString("es-CO")} totales
            </Text>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push("/estudiante/aparatos")}
            >
              <Text style={styles.quickIcon}>🔌</Text>
              <Text style={styles.quickLabel}>Aparatos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push("/estudiante/division")}
            >
              <Text style={styles.quickIcon}>👥</Text>
              <Text style={styles.quickLabel}>División</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => router.push("/estudiante/consejos")}
            >
              <Text style={styles.quickIcon}>💡</Text>
              <Text style={styles.quickLabel}>Consejos</Text>
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
            <Text style={styles.sectionTitle}>
              📚 Consejos para estudiantes
            </Text>
            <Carousel
              data={CONSEJOS_ESTUDIANTE}
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
                {CONSEJOS_ESTUDIANTE.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === activeIndex && styles.dotActive]}
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
        <BottomNav tipo="estudiante" />
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
  cardSub2: { fontSize: 11, color: "#6b7c74", marginBottom: 4 },
  cardAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 4,
  },
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


