import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Carousel from "react-native-reanimated-carousel";
import BottomNav from "../../components/BottomNav";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";
import { getTarifaEmpresa } from "../../lib/tarifas";

const { width } = Dimensions.get("window");
const COLORES = [
  "#4a90d9",
  "#2e8b57",
  "#d4b24a",
  "#e09052",
  "#9b59b6",
  "#e05252",
];
const ICONOS = ["🏭", "🏢", "💡", "🖥️", "🔧", "📦", "🏗️", "⚙️"];
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

const HORARIOS = [
  { label: "Solo lunes", dias: 1, maxHoras: 24 },
  { label: "Lunes a martes", dias: 2, maxHoras: 48 },
  { label: "Lunes a miércoles", dias: 3, maxHoras: 72 },
  { label: "Lunes a jueves", dias: 4, maxHoras: 96 },
  { label: "Lunes a viernes", dias: 5, maxHoras: 120 },
  { label: "Lunes a sábado", dias: 6, maxHoras: 144 },
  { label: "Lunes a domingo", dias: 7, maxHoras: 168 },
];

const CONSEJOS_EMPRESA = [
  {
    icon: "⏰",
    titulo: "Programa apagados automáticos",
    desc: "El consumo en standby puede ser el 20% del total. Programa apagados fuera del horario laboral.",
  },
  {
    icon: "💡",
    titulo: "Iluminación LED industrial",
    desc: "Cambiar a LED en zonas de producción reduce el consumo de iluminación hasta un 60%.",
  },
  {
    icon: "🌡️",
    titulo: "Control de temperatura",
    desc: "Cada grado adicional en A/C industrial aumenta el consumo un 8%. Mantén temperaturas óptimas.",
  },
  {
    icon: "⚡",
    titulo: "Monitoreo por sector",
    desc: "Instalar medidores por sector permite identificar picos de consumo y reducirlos hasta un 15%.",
  },
  {
    icon: "🔧",
    titulo: "Mantenimiento preventivo",
    desc: "Equipos en mal estado consumen hasta 30% más. El mantenimiento regular reduce costos.",
  },
  {
    icon: "📊",
    titulo: "Auditoría energética",
    desc: "Una auditoría anual puede identificar oportunidades de ahorro del 20-30% en consumo industrial.",
  },
];

export default function EmpresaInicio() {
  const router = useRouter();
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [empresaEnergia, setEmpresaEnergia] = useState("EPM");
  const [tipoActivos, setTipoActivos] = useState("activos_empresa");
  const [tarifa, setTarifa] = useState(1141);
  const [meta, setMeta] = useState(0);
  const [sectores, setSectores] = useState<any[]>([]);
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  const [mesCerrado, setMesCerrado] = useState(new Date().getMonth());
  const [anioCerrado, setAnioCerrado] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showNuevoMesModal, setShowNuevoMesModal] = useState(false);
  const [nuevaMeta, setNuevaMeta] = useState("");
  const [secNombre, setSecNombre] = useState("");
  const [secEquipos, setSecEquipos] = useState("");
  const [secWatts, setSecWatts] = useState("");
  const [secHoras, setSecHoras] = useState("");
  const [secHorario, setSecHorario] = useState(HORARIOS[4]);
  const [secIcono, setSecIcono] = useState("🏭");
  const [activeIndex, setActiveIndex] = useState(0);
  const [editando, setEditando] = useState<any>(null);

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
      .select(
        "nombre_empresa, empresa_energia, tipo_activos, meta_mensual, mes_actual, anio_actual",
      )
      .eq("id", user.id)
      .single();

    if (usuario) {
      setNombreEmpresa(usuario.nombre_empresa || "Mi Empresa");
      if (usuario.empresa_energia) setEmpresaEnergia(usuario.empresa_energia);
      if (usuario.tipo_activos) setTipoActivos(usuario.tipo_activos);
      setMeta(usuario.meta_mensual || 2800000);

      // Usar mes guardado en BD, si no existe usar fecha actual
      const ahora = new Date();
      setMesActual(usuario.mes_actual ?? ahora.getMonth());
      setAnioActual(usuario.anio_actual ?? ahora.getFullYear());

      if (usuario.empresa_energia && usuario.tipo_activos) {
        const t = await getTarifaEmpresa(
          usuario.empresa_energia,
          usuario.tipo_activos,
        );
        setTarifa(t);
      }
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

  const cerrarMes = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Guardar mes actual en historial
    await supabase.from("historial_empresa").upsert(
      {
        usuario_id: user.id,
        mes: mesActual,
        anio: anioActual,
        total_kwh: totalKwh,
        total_cop: totalCop,
        meta,
        sectores,
        cerrado: true,
      },
      { onConflict: "usuario_id,mes,anio" },
    );

    // Guardar qué mes se cerró para el modal
    setMesCerrado(mesActual);
    setAnioCerrado(anioActual);

    // Calcular siguiente mes
    const mesNuevo = mesActual === 11 ? 0 : mesActual + 1;
    const anioNuevo = mesActual === 11 ? anioActual + 1 : anioActual;

    // Guardar nuevo mes en Supabase
    await supabase
      .from("usuarios")
      .update({
        mes_actual: mesNuevo,
        anio_actual: anioNuevo,
      })
      .eq("id", user.id);

    setMesActual(mesNuevo);
    setAnioActual(anioNuevo);
    setShowCierreModal(false);
    setShowNuevoMesModal(true);
    cargarDatos();
  };

  const abrirEditar = (s: any) => {
    setEditando(s);
    setSecNombre(s.nombre);
    setSecEquipos(String(s.num_equipos || ""));
    setSecWatts(String(s.watts || ""));
    setSecHoras(String(s.horas_dia || ""));
    const horario = HORARIOS.find((h) => h.label === s.horario) || HORARIOS[4];
    setSecHorario(horario);
    setSecIcono(s.icono || "🏭");
    setShowModal(true);
  };

  const calcularKwh = () => {
    const w = parseFloat(secWatts) || 0;
    const h = Math.min(
      parseFloat(secHoras) || 0,
      secHorario.maxHoras / secHorario.dias,
    );
    const equipos = parseInt(secEquipos) || 1;
    return (w / 1000) * h * secHorario.dias * 4.33 * equipos;
  };

  const totalKwh = sectores.reduce((s, x) => s + (x.kwh_mes || 0), 0);
  const totalCop = totalKwh * tarifa;
  const pctMeta = meta > 0 ? Math.round((totalCop / meta) * 100) : 0;
  const overMeta = totalCop > meta;

  const guardarSector = async () => {
    if (!secNombre || !secWatts || !secHoras || !secEquipos) {
      Alert.alert("Error", "Completa nombre, equipos, potencia y horas/día");
      return;
    }
    const horasNum = parseFloat(secHoras);
    const maxHorasDia = secHorario.maxHoras / secHorario.dias;
    if (horasNum > maxHorasDia) {
      Alert.alert(
        "Error",
        `Para ${secHorario.label} el máximo es ${maxHorasDia}h/día`,
      );
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const kwhMes = calcularKwh();

    if (editando) {
      const { error } = await supabase
        .from("sectores")
        .update({
          nombre: secNombre,
          icono: secIcono,
          num_equipos: parseInt(secEquipos) || 0,
          horario: secHorario.label,
          kwh_mes: kwhMes,
          watts: parseFloat(secWatts),
          horas_dia: parseFloat(secHoras),
        })
        .eq("id", editando.id);
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("sectores").upsert(
        {
          usuario_id: user.id,
          nombre: secNombre,
          icono: secIcono,
          num_equipos: parseInt(secEquipos) || 0,
          horario: secHorario.label,
          kwh_mes: kwhMes,
          watts: parseFloat(secWatts),
          horas_dia: parseFloat(secHoras),
        },
        { onConflict: "usuario_id,nombre" },
      );
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
    }

    setSecNombre("");
    setSecEquipos("");
    setSecWatts("");
    setSecHoras("");
    setSecHorario(HORARIOS[4]);
    setSecIcono("🏭");
    setEditando(null);
    setShowModal(false);
    cargarDatos();
  };

  const eliminarSector = (id: string) => {
    Alert.alert("Eliminar sector", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await supabase.from("sectores").delete().eq("id", id);
          cargarDatos();
        },
      },
    ]);
  };

  const generarAlertas = () => {
    const alertas: any[] = [];
    if (sectores.length === 0) return alertas;
    const top = [...sectores].sort((a, b) => b.kwh_mes - a.kwh_mes)[0];
    const pctTop =
      totalKwh > 0 ? Math.round((top.kwh_mes / totalKwh) * 100) : 0;
    alertas.push({
      color: pctTop > 40 ? "#fde8e8" : "#fdf3e0",
      dot: pctTop > 40 ? "#e05252" : "#e09052",
      text: `${top.nombre} representa el ${pctTop}% del consumo total.`,
    });
    if (overMeta)
      alertas.push({
        color: "#fdf3e0",
        dot: "#e09052",
        text: `Superaste la meta en un ${pctMeta - 100}%. Reduce el consumo en los sectores más activos.`,
      });
    else
      alertas.push({
        color: "#e8f5ee",
        dot: "#2e8b57",
        text: `Estás dentro de la meta mensual (${pctMeta}%). ¡Buen trabajo!`,
      });
    if (totalKwh > 55000)
      alertas.push({
        color: "#e8f0fa",
        dot: "#4a90d9",
        text: `Tu consumo supera los 55.000 kWh/mes. Puedes negociar tarifas en el Mercado No Regulado.`,
      });
    if (sectores.length < 3)
      alertas.push({
        color: "#fdf3e0",
        dot: "#e09052",
        text: "Registra todos tus sectores para un cálculo más preciso.",
      });
    return alertas;
  };

  const kwhPreview = calcularKwh();
  const copPreview = kwhPreview * tarifa;
  const maxHorasDia = secHorario.maxHoras / secHorario.dias;
  const equiposNum = parseInt(secEquipos) || 1;
  const kwhPorEquipo = equiposNum > 0 ? kwhPreview / equiposNum : 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Header />
        <ScrollView style={styles.body}>
          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <View>
                <Text style={styles.todayNombre}>{nombreEmpresa}</Text>
                <Text style={styles.todaySubtitle}>
                  {MESES[mesActual]} {anioActual} · {empresaEnergia} $
                  {tarifa.toLocaleString("es-CO")}/kWh
                </Text>
              </View>
              <Text style={{ fontSize: 28 }}>🏢</Text>
            </View>
            <View style={styles.todayStats}>
              <View>
                <Text style={styles.todayLabel}>Consumo actual</Text>
                <Text style={styles.todayVal}>
                  {totalKwh.toLocaleString("es-CO")} kWh
                </Text>
                <Text style={styles.todayDelta}>Tarifa comercial 2026</Text>
              </View>
              <View>
                <Text style={styles.todayLabel}>Gasto actual</Text>
                <Text style={styles.todayVal}>
                  COP ${Math.round(totalCop).toLocaleString("es-CO")}
                </Text>
                <Text
                  style={[styles.todayDelta, overMeta && { color: "#ffb3b3" }]}
                >
                  {overMeta ? "↑ Sobre la meta" : "✓ Dentro de meta"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>
                Resumen · {MESES[mesActual]} {anioActual}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setNuevaMeta(String(meta));
                  setShowMetaModal(true);
                }}
              >
                <Text style={styles.editBtn}>✏ Meta</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>Consumo total</Text>
                <Text style={styles.statVal}>
                  {totalKwh.toLocaleString("es-CO")} kWh
                </Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Gasto total</Text>
                <Text style={styles.statVal}>
                  COP ${Math.round(totalCop).toLocaleString("es-CO")}
                </Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Meta mensual</Text>
                <Text style={styles.statVal}>
                  COP ${meta.toLocaleString("es-CO")}
                </Text>
              </View>
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
            <Text
              style={[
                styles.pctLabel,
                { color: overMeta ? "#e05252" : "#2e8b57" },
              ]}
            >
              {pctMeta}% de la meta
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Sectores de consumo</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  setEditando(null);
                  setSecNombre("");
                  setSecEquipos("");
                  setSecWatts("");
                  setSecHoras("");
                  setSecHorario(HORARIOS[4]);
                  setSecIcono("🏭");
                  setShowModal(true);
                }}
              >
                <Text style={styles.addBtnText}>+ Sector</Text>
              </TouchableOpacity>
            </View>
            {sectores.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  No hay sectores registrados.
                </Text>
                <Text style={styles.emptySub}>
                  Agrega sectores para ver el análisis.
                </Text>
              </View>
            ) : (
              <View style={styles.legendBox}>
                {sectores.map((s, i) => {
                  const pct =
                    totalKwh > 0 ? Math.round((s.kwh_mes / totalKwh) * 100) : 0;
                  return (
                    <View key={s.id} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: COLORES[i % COLORES.length] },
                        ]}
                      />
                      <Text style={styles.legendText}>
                        {s.nombre} {pct}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {sectores.map((s, i) => {
            const pct =
              totalKwh > 0 ? Math.round((s.kwh_mes / totalKwh) * 100) : 0;
            const cop = s.kwh_mes * tarifa;
            const copPorEquipo = s.num_equipos > 0 ? cop / s.num_equipos : cop;
            return (
              <View
                key={s.id}
                style={[
                  styles.sectorCard,
                  { borderLeftColor: COLORES[i % COLORES.length] },
                ]}
              >
                <View style={styles.sectorTop}>
                  <Text style={styles.sectorIcon}>{s.icono}</Text>
                  <View style={styles.sectorInfo}>
                    <Text style={styles.sectorNombre}>{s.nombre}</Text>
                    <Text style={styles.sectorMeta}>
                      {s.num_equipos} equipos · {s.watts}W c/u · {s.horario}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => abrirEditar(s)}
                    style={styles.editSectorBtn}
                  >
                    <Text style={styles.editSectorBtnText}>✏</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => eliminarSector(s.id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.sectorBarRow}>
                  <View style={styles.sectorBarTrack}>
                    <View
                      style={[
                        styles.sectorBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: COLORES[i % COLORES.length],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.sectorPct}>{pct}%</Text>
                </View>
                <View style={styles.sectorFooter}>
                  <Text style={styles.sectorKwh}>
                    {s.kwh_mes.toFixed(1)} kWh · $
                    {Math.round(copPorEquipo).toLocaleString("es-CO")}/equipo
                  </Text>
                  <Text
                    style={[
                      styles.sectorCop,
                      { color: COLORES[i % COLORES.length] },
                    ]}
                  >
                    COP ${Math.round(cop).toLocaleString("es-CO")}/mes
                  </Text>
                </View>
              </View>
            );
          })}

          {generarAlertas().length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Alertas y recomendaciones</Text>
              {generarAlertas().map((a, i) => (
                <View
                  key={i}
                  style={[styles.alertItem, { backgroundColor: a.color }]}
                >
                  <View style={[styles.alertDot, { backgroundColor: a.dot }]} />
                  <Text style={styles.alertText}>{a.text}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>💡 Consejos para tu empresa</Text>
            <Carousel
              data={CONSEJOS_EMPRESA}
              renderItem={({ item }: any) => (
                <View style={styles.carouselCard}>
                  <Text style={styles.carouselIcon}>{item.icon}</Text>
                  <Text style={styles.carouselTitulo}>{item.titulo}</Text>
                  <Text style={styles.carouselDesc}>{item.desc}</Text>
                </View>
              )}
              width={width - 80}
              height={170}
              loop
              autoPlay
              autoPlayInterval={4000}
              onProgressChange={(_, i) => setActiveIndex(Math.round(i))}
            />
            <View style={styles.carouselNav}>
              <Text style={styles.carouselArrow}>‹ desliza ›</Text>
              <View style={styles.dotsRow}>
                {CONSEJOS_EMPRESA.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === activeIndex && styles.dotActive]}
                  />
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.cerrarMesBtn}
            onPress={() => setShowCierreModal(true)}
          >
            <Text style={styles.cerrarMesBtnText}>
              📅 Cerrar {MESES[mesActual]} y guardar historial
            </Text>
          </TouchableOpacity>
        </ScrollView>
        <BottomNav tipo="empresa" />

        {showModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editando ? "Editar sector" : "Agregar sector"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowModal(false);
                    setEditando(null);
                  }}
                >
                  <Text style={{ fontSize: 18, color: "#6b7c74" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.inputLabel}>ÍCONO</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 14 }}
                >
                  {ICONOS.map((ic, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.iconoBtn,
                        secIcono === ic && styles.iconoBtnActive,
                      ]}
                      onPress={() => setSecIcono(ic)}
                    >
                      <Text style={{ fontSize: 24 }}>{ic}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>NOMBRE DEL SECTOR</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Producción, Oficinas..."
                  value={secNombre}
                  onChangeText={setSecNombre}
                />

                <Text style={styles.inputLabel}>NÚMERO DE EQUIPOS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 48"
                  value={secEquipos}
                  onChangeText={setSecEquipos}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>POTENCIA POR EQUIPO (W)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 1000W por equipo"
                  value={secWatts}
                  onChangeText={setSecWatts}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>DÍAS DE OPERACIÓN</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 14 }}
                >
                  {HORARIOS.map((h, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.horarioBtn,
                        secHorario.label === h.label && styles.horarioBtnActive,
                      ]}
                      onPress={() => {
                        setSecHorario(h);
                        if (parseFloat(secHoras) > h.maxHoras / h.dias)
                          setSecHoras(String(h.maxHoras / h.dias));
                      }}
                    >
                      <Text
                        style={[
                          styles.horarioBtnText,
                          secHorario.label === h.label &&
                            styles.horarioBtnTextActive,
                        ]}
                      >
                        {h.label}
                      </Text>
                      <Text
                        style={[
                          styles.horarioBtnSub,
                          secHorario.label === h.label &&
                            styles.horarioBtnTextActive,
                        ]}
                      >
                        {h.dias} día{h.dias > 1 ? "s" : ""} · máx{" "}
                        {h.maxHoras / h.dias}h/día
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>
                  HORAS/DÍA{" "}
                  <Text style={{ color: "#e05252" }}>
                    (máx. {maxHorasDia}h)
                  </Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Ej. 8 (máx. ${maxHorasDia}h)`}
                  value={secHoras}
                  onChangeText={(v) => {
                    const n = parseFloat(v);
                    if (n > maxHorasDia) setSecHoras(String(maxHorasDia));
                    else setSecHoras(v);
                  }}
                  keyboardType="numeric"
                />

                {kwhPreview > 0 && (
                  <View style={styles.previewBox}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <Text style={styles.previewLabel}>
                        Consumo total del sector/mes
                      </Text>
                      <Text style={styles.previewKwh}>
                        {kwhPreview.toFixed(1)} kWh
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text style={styles.previewLabel}>
                        Consumo por equipo/mes
                      </Text>
                      <Text style={styles.previewKwh}>
                        {kwhPorEquipo.toFixed(1)} kWh
                      </Text>
                    </View>
                    <Text style={styles.previewAmount}>
                      COP ${Math.round(copPreview).toLocaleString("es-CO")}
                    </Text>
                    <Text style={styles.previewTarifa}>
                      {empresaEnergia} 2026: ${tarifa.toLocaleString("es-CO")}
                      /kWh · {equiposNum} equipos × {secWatts}W ·{" "}
                      {secHorario.dias} días/sem · {secHoras}h/día
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    marginTop: 16,
                    marginBottom: 30,
                  }}
                >
                  <TouchableOpacity
                    style={[styles.btnSecondary, { flex: 1 }]}
                    onPress={() => {
                      setShowModal(false);
                      setEditando(null);
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
                    style={[styles.btnPrimary, { flex: 2 }]}
                    onPress={guardarSector}
                  >
                    <Text style={styles.btnText}>
                      {editando ? "Guardar cambios" : "Guardar sector"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {showMetaModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { maxHeight: 320 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar meta mensual</Text>
                <TouchableOpacity onPress={() => setShowMetaModal(false)}>
                  <Text style={{ fontSize: 18, color: "#6b7c74" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={{ padding: 20 }}>
                <Text style={styles.inputLabel}>NUEVA META (COP)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 2.800.000"
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
                <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.btnSecondary, { flex: 1 }]}
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
                    style={[styles.btnPrimary, { flex: 2 }]}
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
          </View>
        )}

        {showCierreModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { maxHeight: 400 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  📅 Cerrar {MESES[mesActual]}
                </Text>
                <TouchableOpacity onPress={() => setShowCierreModal(false)}>
                  <Text style={{ fontSize: 18, color: "#6b7c74" }}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={{ padding: 20 }}>
                <Text style={styles.cierreText}>
                  ¿Deseas cerrar {MESES[mesActual]} {anioActual} y guardar los
                  datos en tu historial?
                </Text>
                <View style={styles.cierreResumen}>
                  <Text style={styles.cierreResumenLabel}>Consumo total</Text>
                  <Text style={styles.cierreResumenVal}>
                    {totalKwh.toFixed(1)} kWh
                  </Text>
                  <Text style={styles.cierreResumenLabel}>Gasto total</Text>
                  <Text style={styles.cierreResumenVal}>
                    COP ${Math.round(totalCop).toLocaleString("es-CO")}
                  </Text>
                  <Text style={styles.cierreResumenLabel}>vs Meta</Text>
                  <Text
                    style={[
                      styles.cierreResumenVal,
                      { color: overMeta ? "#e05252" : "#2e8b57" },
                    ]}
                  >
                    {pctMeta}%{" "}
                    {overMeta ? "⚠️ Sobre meta" : "✅ Dentro de meta"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.btnSecondary, { flex: 1 }]}
                    onPress={() => setShowCierreModal(false)}
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
                    style={[styles.btnPrimary, { flex: 2 }]}
                    onPress={cerrarMes}
                  >
                    <Text style={styles.btnText}>Cerrar y guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {showNuevoMesModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { maxHeight: 300 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎉 Mes guardado</Text>
              </View>
              <View style={{ padding: 20 }}>
                <Text style={styles.cierreText}>
                  ¡{MESES[mesCerrado]} {anioCerrado} guardado correctamente!
                  {"\n\n"}
                  Ahora estás registrando {MESES[mesActual]} {anioActual}.
                </Text>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => setShowNuevoMesModal(false)}
                >
                  <Text style={styles.btnText}>Entendido</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f3" },
  body: { padding: 20 },
  todayCard: {
    backgroundColor: "#1a5c3a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  todayNombre: { fontSize: 16, fontWeight: "700", color: "#fff" },
  todaySubtitle: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  todayStats: { flexDirection: "row", justifyContent: "space-between" },
  todayLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 2 },
  todayVal: { fontSize: 15, fontWeight: "700", color: "#fff" },
  todayDelta: { fontSize: 10, color: "#7ee8a2", marginTop: 2 },
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
  editBtn: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a5c3a",
    backgroundColor: "#e8f5ee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statLabel: { fontSize: 10, color: "#6b7c74", marginBottom: 2 },
  statVal: { fontSize: 11, fontWeight: "700", color: "#0f2e1e" },
  barTrack: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  barFill: { height: "100%", borderRadius: 4 },
  pctLabel: { fontSize: 12, fontWeight: "700", textAlign: "right" },
  addBtn: {
    backgroundColor: "#1a5c3a",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  emptyBox: { alignItems: "center", padding: 20 },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7c74",
    marginBottom: 4,
  },
  emptySub: { fontSize: 12, color: "#6b7c74", textAlign: "center" },
  legendBox: { gap: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#0f2e1e" },
  sectorCard: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1,
    borderColor: "#b2d8c4",
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  sectorTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  sectorIcon: { fontSize: 24 },
  sectorInfo: { flex: 1 },
  sectorNombre: { fontSize: 14, fontWeight: "700", color: "#0f2e1e" },
  sectorMeta: { fontSize: 11, color: "#6b7c74", marginTop: 2 },
  editSectorBtn: { backgroundColor: "#e8f5ee", borderRadius: 8, padding: 6 },
  editSectorBtnText: { fontSize: 14, color: "#1a5c3a" },
  deleteBtn: { fontSize: 14, color: "#6b7c74", padding: 4 },
  sectorBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sectorBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  sectorBarFill: { height: "100%", borderRadius: 3 },
  sectorPct: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7c74",
    minWidth: 30,
    textAlign: "right",
  },
  sectorFooter: { flexDirection: "row", justifyContent: "space-between" },
  sectorKwh: { fontSize: 11, color: "#6b7c74" },
  sectorCop: { fontSize: 12, fontWeight: "700" },
  alertItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
    flexShrink: 0,
  },
  alertText: { fontSize: 12, color: "#0f2e1e", flex: 1, lineHeight: 18 },
  carouselCard: {
    backgroundColor: "#1a5c3a",
    borderRadius: 16,
    padding: 20,
    height: 170,
  },
  carouselIcon: { fontSize: 28, marginBottom: 8 },
  carouselTitulo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 6,
  },
  carouselDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 17,
  },
  carouselNav: { alignItems: "center", marginTop: 10 },
  carouselArrow: { fontSize: 12, color: "#6b7c74", marginBottom: 6 },
  dotsRow: { flexDirection: "row", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#b2d8c4" },
  dotActive: { width: 16, borderRadius: 3, backgroundColor: "#1a5c3a" },
  cerrarMesBtn: {
    backgroundColor: "#e8f5ee",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    marginBottom: 30,
  },
  cerrarMesBtnText: { fontSize: 14, fontWeight: "700", color: "#1a5c3a" },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15,46,30,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#e8f5ee",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#1a5c3a" },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1a5c3a",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 13,
    fontSize: 14,
    marginBottom: 14,
  },
  iconoBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f4f9f6",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  iconoBtnActive: { backgroundColor: "#e8f5ee", borderColor: "#1a5c3a" },
  horarioBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    backgroundColor: "#f4f9f6",
    marginRight: 8,
    alignItems: "center",
  },
  horarioBtnActive: { backgroundColor: "#1a5c3a", borderColor: "#1a5c3a" },
  horarioBtnText: { fontSize: 11, fontWeight: "600", color: "#1a5c3a" },
  horarioBtnSub: { fontSize: 10, color: "#6b7c74", marginTop: 2 },
  horarioBtnTextActive: { color: "#fff" },
  previewBox: {
    backgroundColor: "#e8f5ee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  previewLabel: { fontSize: 11, color: "#6b7c74", marginBottom: 2 },
  previewKwh: { fontSize: 11, fontWeight: "700", color: "#1a5c3a" },
  previewAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1a5c3a",
    marginBottom: 2,
  },
  previewTarifa: { fontSize: 10, color: "#6b7c74" },
  btnPrimary: {
    backgroundColor: "#1a5c3a",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 14,
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  cierreText: {
    fontSize: 14,
    color: "#0f2e1e",
    lineHeight: 22,
    marginBottom: 16,
  },
  cierreResumen: {
    backgroundColor: "#e8f5ee",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  cierreResumenLabel: { fontSize: 11, color: "#6b7c74" },
  cierreResumenVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f2e1e",
    marginBottom: 4,
  },
});
