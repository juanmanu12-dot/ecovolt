import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native'
import { useState } from 'react'
import Carousel from 'react-native-reanimated-carousel'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'

const { width } = Dimensions.get('window')

const CONSEJOS_DIA = [
  { icon: '🔌', text: 'Carga tu laptop de noche y desconéctala al terminar. El cargador sigue consumiendo hasta 2W enchufado.', save: '~$3.200/mes', color: '#1a5c3a' },
  { icon: '☀️', text: 'Aprovecha la luz natural al estudiar. Abrir las persianas puede ahorrarte 2-3 horas de iluminación al día.', save: '~$1.800/mes', color: '#2e7a4a' },
  { icon: '💻', text: 'Activa el modo de bajo consumo en tu laptop mientras estudias. Reduce el consumo de la CPU hasta un 30%.', save: '~$2.100/mes', color: '#1f6e3e' },
  { icon: '🌀', text: 'Apaga el ventilador cuando salgas de la habitación. Aunque sea por 30 minutos, el ahorro acumulado es real.', save: '~$2.400/mes', color: '#174f30' },
]

const CATEGORIAS = [
  { id: 'all', label: 'Todos' },
  { id: 'electro', label: '⚡ Electrónica' },
  { id: 'habitos', label: '🔁 Hábitos' },
  { id: 'eco', label: '🌱 Eco' },
]

const TIPS = [
  { cat: 'electro', icon: '💻', title: 'Modo ahorro en laptop', desc: 'Activa el modo de ahorro de energía. Reduce el consumo hasta un 30% en uso normal.', saving: '$2.100/mes', dificultad: 'Fácil', color: '#e8f0fa' },
  { cat: 'electro', icon: '📱', title: 'Desconecta el cargador', desc: 'El cargador consume hasta 2W aunque el celular ya esté al 100%. ¡Desenchúfalo!', saving: '$800/mes', dificultad: 'Fácil', color: '#e8f5ee' },
  { cat: 'electro', icon: '💡', title: 'Cambia a LEDs', desc: 'Una bombilla LED consume hasta 80% menos que una incandescente con la misma luz.', saving: '$4.500/mes', dificultad: 'Media', color: '#fdf8e8' },
  { cat: 'electro', icon: '🖥️', title: 'Apaga el monitor', desc: 'Más de 10 minutos fuera: apaga el monitor. Los salvapantallas consumen casi igual.', saving: '$1.800/mes', dificultad: 'Fácil', color: '#f0e8f8' },
  { cat: 'habitos', icon: '🔌', title: 'Regleta con interruptor', desc: 'Conecta tus aparatos a una regleta y apaga todo de un solo clic al salir.', saving: '$3.600/mes', dificultad: 'Fácil', color: '#e8f5ee' },
  { cat: 'habitos', icon: '🌀', title: 'Ventilador inteligente', desc: 'Un ventilador solo es útil si estás presente. Apágalo, aunque salgas 5 minutos.', saving: '$2.400/mes', dificultad: 'Fácil', color: '#e8f0fa' },
  { cat: 'habitos', icon: '☀️', title: 'Luz natural al estudiar', desc: 'Ubícate cerca de una ventana en el día. Ahorras horas de iluminación artificial.', saving: '$1.200/mes', dificultad: 'Fácil', color: '#fdf8e8' },
  { cat: 'habitos', icon: '⏰', title: 'Fuera de horas pico', desc: 'Usa electrodomésticos pesados antes de las 6 PM para ahorrar en la factura compartida.', saving: '$5.000/mes', dificultad: 'Media', color: '#fde8e8' },
  { cat: 'eco', icon: '🌱', title: 'Streaming en SD', desc: 'Ver video en HD consume 3× más energía que en SD. Baja la calidad cuando no importa.', saving: '$1.500/mes', dificultad: 'Fácil', color: '#e8f5ee' },
  { cat: 'eco', icon: '✈️', title: 'Modo avión al dormir', desc: 'Activa el modo avión mientras duermes. Ahorra batería y reduce la carga de red.', saving: '$600/mes', dificultad: 'Fácil', color: '#e8f0fa' },
  { cat: 'eco', icon: '🌡️', title: '24°C es suficiente', desc: 'Cada grado adicional de A/C sube el consumo un 8%. Mantén 24°C y usa ropa cómoda.', saving: '$8.000/mes', dificultad: 'Media', color: '#fdf8e8' },
]

export default function Consejos() {
  const [todIdx, setTodIdx] = useState(0)
  const [tipsIdx, setTipsIdx] = useState(0)
  const [catActiva, setCatActiva] = useState('all')

  const tipsFiltrados = catActiva === 'all' ? TIPS : TIPS.filter(t => t.cat === catActiva)

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Header showBack title="Consejos de ahorro" />
        <ScrollView style={styles.body}>

          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Text style={styles.seccionLabel}>💡 Consejo del día</Text>
              <View style={styles.dotsRow}>
                {CONSEJOS_DIA.map((_, i) => (
                  <View key={i} style={[styles.dot, i === todIdx && styles.dotActive]}/>
                ))}
              </View>
            </View>
            <Carousel
              data={CONSEJOS_DIA}
              renderItem={({ item }: any) => (
                <View style={[styles.todCard, { backgroundColor: item.color }]}>
                  <Text style={styles.todIcon}>{item.icon}</Text>
                  <Text style={styles.todText}>{item.text}</Text>
                  <View style={styles.todSaveTag}>
                    <Text style={styles.todSave}>💰 {item.save}</Text>
                  </View>
                </View>
              )}
              width={width - 40}
              height={180}
              loop
              autoPlay
              autoPlayInterval={4000}
              onProgressChange={(_, i) => setTodIdx(Math.round(i))}
            />
            <View style={styles.carouselNav}>
              <Text style={styles.carouselArrow}>‹ desliza ›</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTabs}>
            {CATEGORIAS.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catTab, catActiva === cat.id && styles.catTabActive]}
                onPress={() => { setCatActiva(cat.id); setTipsIdx(0) }}
              >
                <Text style={[styles.catTabText, catActiva === cat.id && styles.catTabTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Carousel
            data={tipsFiltrados}
            renderItem={({ item }: any) => (
              <View style={[styles.tipCard, { backgroundColor: item.color }]}>
                <View style={styles.tipTop}>
                  <Text style={styles.tipIcon}>{item.icon}</Text>
                  <View style={styles.tipDifTag}>
                    <Text style={styles.tipDif}>{item.dificultad}</Text>
                  </View>
                </View>
                <Text style={styles.tipTitle}>{item.title}</Text>
                <Text style={styles.tipDesc}>{item.desc}</Text>
                <View style={styles.tipSaveTag}>
                  <Text style={styles.tipSave}>💰 {item.saving}</Text>
                </View>
              </View>
            )}
            width={width - 40}
            height={200}
            loop
            autoPlay
            autoPlayInterval={5000}
            onProgressChange={(_, i) => setTipsIdx(Math.round(i))}
          />
          <View style={styles.carouselNav}>
            <Text style={styles.carouselArrow}>‹ desliza ›</Text>
            <View style={styles.dotsRow}>
              {tipsFiltrados.map((_, i) => (
                <View key={i} style={[styles.dot, i === tipsIdx && styles.dotActive]}/>
              ))}
            </View>
          </View>

        </ScrollView>
        <BottomNav tipo="estudiante" />
      </View>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f3' },
  body: { padding: 20 },
  seccion: { marginBottom: 20 },
  seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seccionLabel: { fontSize: 12, fontWeight: '700', color: '#1a5c3a', letterSpacing: 0.4, textTransform: 'uppercase' },
  todCard: { borderRadius: 16, padding: 20, height: 180 },
  todIcon: { fontSize: 32, marginBottom: 10 },
  todText: { fontSize: 14, lineHeight: 20, color: '#fff', marginBottom: 12 },
  todSaveTag: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  todSave: { fontSize: 12, fontWeight: '700', color: '#fff' },
  carouselNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, marginBottom: 16 },
  carouselArrow: { fontSize: 12, color: '#6b7c74' },
  dotsRow: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#b2d8c4' },
  dotActive: { width: 16, borderRadius: 3, backgroundColor: '#1a5c3a' },
  catTabs: { marginBottom: 14 },
  catTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#b2d8c4', backgroundColor: '#f4f9f6', marginRight: 8 },
  catTabActive: { backgroundColor: '#1a5c3a', borderColor: '#1a5c3a' },
  catTabText: { fontSize: 12, fontWeight: '600', color: '#6b7c74' },
  catTabTextActive: { color: '#fff' },
  tipCard: { borderRadius: 16, padding: 20, height: 200, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)' },
  tipTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tipIcon: { fontSize: 30 },
  tipDifTag: { backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  tipDif: { fontSize: 10, fontWeight: '700', color: '#6b7c74' },
  tipTitle: { fontSize: 18, fontWeight: '900', color: '#0f2e1e', marginBottom: 8, lineHeight: 22 },
  tipDesc: { fontSize: 13, color: '#6b7c74', lineHeight: 18, marginBottom: 14 },
  tipSaveTag: { backgroundColor: 'rgba(46,139,87,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  tipSave: { fontSize: 12, fontWeight: '700', color: '#1a5c3a' },
})