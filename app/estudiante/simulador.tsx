import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useState, useCallback } from 'react'
import Slider from '@react-native-community/slider'
import { supabase } from '../../lib/supabase'
import { useFocusEffect } from 'expo-router'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'

const TARIFA_DEFAULT = 821
const DAYS = 30

function fmt(n: number) { return 'COP $' + Math.round(n).toLocaleString('es-CO') }

export default function Simulador() {
  const [tab, setTab] = useState<'aparato' | 'escenario'>('aparato')
  const [aparatos, setAparatos] = useState<any[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [horasActuales, setHorasActuales] = useState(4)
  const [horasReducir, setHorasReducir] = useState(2)
  const [tarifa, setTarifa] = useState(String(TARIFA_DEFAULT))
  const [activosEscenario, setActivosEscenario] = useState<string[]>([])

  useFocusEffect(useCallback(() => { cargarAparatos() }, []))

  const cargarAparatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('aparatos').select('*').eq('usuario_id', user.id)
    if (data) {
      setAparatos(data)
      setActivosEscenario(data.filter((a: any) => a.activo).map((a: any) => a.id))
    }
  }

  const aparatoSel = aparatos[selectedIdx]
  const tarifaNum = parseFloat(tarifa) || TARIFA_DEFAULT
  const watts = aparatoSel?.watts || 0

  const kwhAntes = (watts / 1000) * horasActuales * DAYS
  const kwhDespues = (watts / 1000) * horasReducir * DAYS
  const kwhAhorro = kwhAntes - kwhDespues
  const copAhorro = kwhAhorro * tarifaNum
  const co2 = (kwhAhorro * 0.126).toFixed(1)

  const toggleEscenario = (id: string) => {
    setActivosEscenario(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const activosData = aparatos.filter(a => activosEscenario.includes(a.id))
  const totalKwhEsc = activosData.reduce((s, a) => s + (a.watts / 1000) * a.horas_dia * DAYS, 0)
  const totalCopEsc = totalKwhEsc * tarifaNum

  const generarMensaje = () => {
    const apagados = aparatos.length - activosData.length
    if (activosData.length === 0) return '✅ Sin consumo activo. Perfecto para maximizar el ahorro.'
    if (activosData.length === aparatos.length) {
      const top = [...aparatos].sort((a, b) => b.watts * b.horas_dia - a.watts * a.horas_dia)[0]
      return `⚡ Todos activos. Consumo: ${totalKwhEsc.toFixed(1)} kWh (${fmt(totalCopEsc)}/mes). Considera reducir el uso de ${top?.nombre}.`
    }
    if (apagados === 1) {
      const apagado = aparatos.find(a => !activosEscenario.includes(a.id))
      const ahorro = (apagado?.watts / 1000) * apagado?.horas_dia * DAYS * tarifaNum
      return `💡 Apagaste ${apagado?.nombre}. Ahorras ${fmt(ahorro)}/mes. Consumo restante: ${totalKwhEsc.toFixed(1)} kWh (${fmt(totalCopEsc)}/mes).`
    }
    if (totalCopEsc < 10000) return `🌱 Excelente. Solo ${totalKwhEsc.toFixed(1)} kWh al mes (${fmt(totalCopEsc)}). Muy bajo impacto.`
    if (totalCopEsc < 25000) return `👍 Buen control. ${totalKwhEsc.toFixed(1)} kWh al mes (${fmt(totalCopEsc)}). ${apagados} aparato(s) apagado(s).`
    return `⚠️ Consumo moderado: ${totalKwhEsc.toFixed(1)} kWh (${fmt(totalCopEsc)}/mes). Apaga más aparatos para reducir tu factura.`
  }

  const maxBar = Math.max(kwhAntes, 0.1)

  return (
    <View style={styles.container}>
      <Header showBack title="Simulador" />
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'aparato' && styles.tabActive]} onPress={() => setTab('aparato')}>
          <Text style={[styles.tabText, tab === 'aparato' && styles.tabTextActive]}>Por aparato</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'escenario' && styles.tabActive]} onPress={() => setTab('escenario')}>
          <Text style={[styles.tabText, tab === 'escenario' && styles.tabTextActive]}>Escenarios</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body}>
        {tab === 'aparato' ? (
          <>
            <Text style={styles.desc}>Ingresa kWh o elige un aparato y simula cuánto ahorras reduciendo horas de uso.</Text>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>APARATO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {aparatos.map((a, i) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.apChip, selectedIdx === i && styles.apChipActive]}
                    onPress={() => {
                      setSelectedIdx(i)
                      setHorasActuales(a.horas_dia)
                      setHorasReducir(Math.max(0.5, a.horas_dia - 2))
                    }}
                  >
                    <Text style={styles.apChipIcon}>{a.icono}</Text>
                    <Text style={[styles.apChipText, selectedIdx === i && styles.apChipTextActive]}>
                      {a.nombre} ({a.watts}W)
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.sliderSection}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Horas actuales/día</Text>
                  <View style={styles.sliderBadgeGreen}>
                    <Text style={styles.sliderBadgeText}>{horasActuales.toFixed(1)}H</Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={24}
                  step={0.5}
                  value={horasActuales}
                  onValueChange={(v) => {
                    setHorasActuales(v)
                    if (horasReducir >= v) setHorasReducir(Math.max(0.5, v - 0.5))
                  }}
                  minimumTrackTintColor="#1a5c3a"
                  maximumTrackTintColor="#b2d8c4"
                  thumbTintColor="#1a5c3a"
                />
              </View>

              <View style={styles.sliderSection}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Reducir a</Text>
                  <View style={styles.sliderBadgeRed}>
                    <Text style={styles.sliderBadgeText}>{horasReducir.toFixed(1)}H</Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={horasActuales}
                  step={0.5}
                  value={horasReducir}
                  onValueChange={setHorasReducir}
                  minimumTrackTintColor="#e05252"
                  maximumTrackTintColor="#fde8e8"
                  thumbTintColor="#e05252"
                />
              </View>

              <Text style={styles.inputLabel}>TARIFA KWH (COP)</Text>
              <TextInput
                style={styles.input}
                value={tarifa}
                onChangeText={setTarifa}
                keyboardType="numeric"
              />
            </View>

            {aparatoSel && (
              <View style={styles.resultCard}>
                <View style={styles.resultTop}>
                  <View>
                    <Text style={styles.resultLabel}>AHORRO MENSUAL</Text>
                    <Text style={styles.resultAmount}>{fmt(copAhorro)}</Text>
                    <Text style={styles.resultSub}>
                      Reduciendo {(horasActuales - horasReducir).toFixed(1)}h/día · {kwhAhorro.toFixed(1)} kWh menos
                    </Text>
                  </View>
                  <View style={styles.co2Badge}>
                    <Text style={styles.co2Text}>🌱 {co2} kg CO₂</Text>
                  </View>
                </View>

                <View style={styles.compareBars}>
                  <View style={styles.barCol}>
                    <View style={styles.barWrap}>
                      <View style={[styles.barFillBefore, {
                        height: Math.max(8, (kwhAntes / maxBar) * 60)
                      }]}/>
                    </View>
                    <Text style={styles.barLabel}>{horasActuales.toFixed(1)}h</Text>
                    <Text style={styles.barCaption}>Antes</Text>
                  </View>
                  <Text style={styles.barArrow}>→</Text>
                  <View style={styles.barCol}>
                    <View style={styles.barWrap}>
                      <View style={[styles.barFillAfter, {
                        height: Math.max(4, (kwhDespues / maxBar) * 60)
                      }]}/>
                    </View>
                    <Text style={styles.barLabel}>{horasReducir.toFixed(1)}h</Text>
                    <Text style={styles.barCaption}>Después</Text>
                  </View>
                  <View style={styles.savingCol}>
                    <Text style={styles.savingLabel}>AHORRO</Text>
                    <Text style={styles.savingKwh}>{kwhAhorro.toFixed(1)} kWh</Text>
                  </View>
                </View>
              </View>
            )}

            {aparatos.length === 0 && (
              <View style={styles.alertCard}>
                <Text style={styles.alertText}>📱 Agrega aparatos en Mi Inventario para simular su consumo.</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.desc}>Activa o desactiva tus aparatos y ve cómo cambia tu consumo total.</Text>

            {aparatos.length === 0 ? (
              <View style={styles.alertCard}>
                <Text style={styles.alertText}>📱 Agrega aparatos en Mi Inventario para simular escenarios.</Text>
              </View>
            ) : (
              <>
                {aparatos.map((a) => {
                  const isActive = activosEscenario.includes(a.id)
                  const cop = (a.watts / 1000) * a.horas_dia * DAYS * tarifaNum
                  return (
                    <View key={a.id} style={[styles.scenarioCard, !isActive && styles.scenarioCardOff]}>
                      <Text style={styles.scenarioEmoji}>{a.icono}</Text>
                      <View style={styles.scenarioInfo}>
                        <Text style={[styles.scenarioName, !isActive && styles.textOff]}>{a.nombre}</Text>
                        <Text style={styles.scenarioDesc}>{a.watts}W · {a.horas_dia}h/día · {fmt(cop)}/mes</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.toggle, !isActive && styles.toggleOff]}
                        onPress={() => toggleEscenario(a.id)}
                      />
                    </View>
                  )
                })}

                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>CONSUMO CON ESTA COMBINACIÓN</Text>
                  <Text style={styles.resultAmount}>{fmt(totalCopEsc)}</Text>
                  <Text style={styles.resultSub}>{totalKwhEsc.toFixed(1)} kWh · {activosData.length} de {aparatos.length} aparatos activos</Text>
                  <View style={styles.mensajeBox}>
                    <Text style={styles.mensajeText}>{generarMensaje()}</Text>
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
      <BottomNav tipo="estudiante" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f3' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#b2d8c4' },
  tab: { flex: 1, padding: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1a5c3a', backgroundColor: '#e8f5ee' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7c74' },
  tabTextActive: { color: '#1a5c3a' },
  body: { padding: 20 },
  desc: { fontSize: 13, color: '#6b7c74', marginBottom: 16, lineHeight: 18 },
  card: { backgroundColor: '#f4f9f6', borderWidth: 1, borderColor: '#b2d8c4', borderRadius: 16, padding: 16, marginBottom: 14 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#1a5c3a', letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#b2d8c4', borderRadius: 16, padding: 13, fontSize: 14, marginBottom: 8 },
  apChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#b2d8c4', borderRadius: 20 },
  apChipActive: { backgroundColor: '#1a5c3a', borderColor: '#1a5c3a' },
  apChipIcon: { fontSize: 16 },
  apChipText: { fontSize: 12, fontWeight: '600', color: '#1a5c3a' },
  apChipTextActive: { color: '#fff' },
  sliderSection: { marginBottom: 16 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sliderLabel: { fontSize: 12, fontWeight: '600', color: '#0f2e1e' },
  sliderBadgeGreen: { backgroundColor: '#1a5c3a', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  sliderBadgeRed: { backgroundColor: '#e05252', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  sliderBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  slider: { width: '100%', height: 40 },
  resultCard: { backgroundColor: '#e8f5ee', borderWidth: 2, borderColor: '#b2d8c4', borderRadius: 16, padding: 20, marginBottom: 12 },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  resultLabel: { fontSize: 10, fontWeight: '600', color: '#1a5c3a', letterSpacing: 0.5, marginBottom: 4 },
  resultAmount: { fontSize: 32, fontWeight: '900', color: '#1a5c3a', marginBottom: 2 },
  resultSub: { fontSize: 11, color: '#6b7c74' },
  co2Badge: { backgroundColor: 'rgba(46,139,87,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  co2Text: { fontSize: 11, fontWeight: '700', color: '#1a5c3a' },
  compareBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  barCol: { alignItems: 'center', gap: 4 },
  barArrow: { fontSize: 18, color: '#6b7c74', marginBottom: 20 },
  barWrap: { width: 40, height: 60, backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 6, justifyContent: 'flex-end' },
  barFillBefore: { width: '100%', backgroundColor: '#b2d8c4', borderRadius: 4 },
  barFillAfter: { width: '100%', backgroundColor: '#2e8b57', borderRadius: 4 },
  barLabel: { fontSize: 11, fontWeight: '700', color: '#0f2e1e' },
  barCaption: { fontSize: 9, color: '#6b7c74' },
  savingCol: { flex: 1, marginLeft: 8 },
  savingLabel: { fontSize: 9, color: '#6b7c74', textTransform: 'uppercase', letterSpacing: 0.4 },
  savingKwh: { fontSize: 14, fontWeight: '700', color: '#1a5c3a' },
  alertCard: { backgroundColor: '#e8f5ee', borderRadius: 10, padding: 12 },
  alertText: { fontSize: 12, color: '#0f2e1e', lineHeight: 18 },
  scenarioCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#f4f9f6', borderWidth: 1, borderColor: '#b2d8c4', borderRadius: 12, marginBottom: 10 },
  scenarioCardOff: { opacity: 0.5 },
  scenarioEmoji: { fontSize: 24 },
  scenarioInfo: { flex: 1 },
  scenarioName: { fontSize: 13, fontWeight: '600', color: '#0f2e1e' },
  scenarioDesc: { fontSize: 11, color: '#6b7c74', marginTop: 2 },
  textOff: { color: '#6b7c74' },
  toggle: { width: 36, height: 20, borderRadius: 10, backgroundColor: '#2e8b57' },
  toggleOff: { backgroundColor: '#b2d8c4' },
  mensajeBox: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 10, padding: 10, marginTop: 12 },
  mensajeText: { fontSize: 12, fontWeight: '700', color: '#0f2e1e', lineHeight: 18 },
})