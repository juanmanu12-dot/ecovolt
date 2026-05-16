import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native'
import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useFocusEffect } from 'expo-router'

const TARIFA = 721
const DAYS = 30
const BUDGET = 430000

function fmt(n: number) { return 'COP $' + Math.round(n).toLocaleString('es-CO') }
function calcKwh(w: number, h: number) { return (w / 1000) * h * DAYS }
function calcCop(w: number, h: number) { return calcKwh(w, h) * TARIFA }

const CATALOG = [
  { icon: '🧊', name: 'Nevera', w: 180, h: 24 },
  { icon: '❄️', name: 'Aire Acondicionado', w: 1200, h: 4 },
  { icon: '📺', name: 'Televisor', w: 100, h: 4 },
  { icon: '🫧', name: 'Lavadora', w: 500, h: 1 },
  { icon: '💡', name: 'Bombillo LED', w: 10, h: 6 },
  { icon: '🖥️', name: 'Computador', w: 150, h: 8 },
  { icon: '🌀', name: 'Ventilador', w: 45, h: 6 },
  { icon: '☕', name: 'Cafetera', w: 800, h: 0.3 },
  { icon: '🔥', name: 'Ducha eléctrica', w: 3500, h: 0.5 },
  { icon: '🍳', name: 'Estufa eléctrica', w: 2000, h: 1 },
]

export default function Aparatos() {
  const [devices, setDevices] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [watts, setWatts] = useState('')
  const [horas, setHoras] = useState('')

  useFocusEffect(useCallback(() => { cargarAparatos() }, []))

  const cargarAparatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('aparatos')
      .select('*')
      .eq('usuario_id', user.id)
    if (data) setDevices(data)
    if (error) console.log('Error:', error.message)
  }

  const fillFromCatalog = (item: any) => {
    setNombre(item.name)
    setWatts(String(item.w))
    setHoras(String(item.h))
  }

  const guardarAparato = async () => {
    if (!nombre || !watts || !horas) {
      Alert.alert('Error', 'Completa todos los campos')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { Alert.alert('Error', 'No hay sesión activa'); return }

    const match = CATALOG.find(c => c.name.toLowerCase() === nombre.toLowerCase())
    const icon = match ? match.icon : '🔌'

    const { error } = await supabase.from('aparatos').insert({
      usuario_id: user.id,
      nombre: nombre,
      icono: icon,
      watts: parseFloat(watts),
      horas_dia: parseFloat(horas),
      activo: true,
    })

    if (error) { Alert.alert('Error', error.message); return }

    setNombre('')
    setWatts('')
    setHoras('')
    setShowModal(false)
    cargarAparatos()
  }

  const toggleAparato = async (id: string, activo: boolean) => {
    await supabase.from('aparatos').update({ activo: !activo }).eq('id', id)
    cargarAparatos()
  }

  const totalKwh = devices.filter(d => d.activo).reduce((s, d) => s + calcKwh(d.watts, d.horas_dia), 0)
  const totalCop = devices.filter(d => d.activo).reduce((s, d) => s + calcCop(d.watts, d.horas_dia), 0)
  const pct = Math.min(100, Math.round((totalCop / BUDGET) * 100))

  const kwh = parseFloat(watts) && parseFloat(horas) ? calcKwh(parseFloat(watts), parseFloat(horas)) : 0
  const cop = parseFloat(watts) && parseFloat(horas) ? calcCop(parseFloat(watts), parseFloat(horas)) : 0

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Evocolt</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body}>
        <Text style={styles.title}>Mi Inventario</Text>
        <Text style={styles.sub}>{totalKwh.toFixed(1)} kWh/mes estimados</Text>

        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            Tienes {devices.filter(d => calcCop(d.watts, d.horas_dia) > 50000).length} aparato(s) de alto consumo
          </Text>
        </View>

        {devices.map((d) => {
          const cop = calcCop(d.watts, d.horas_dia)
          const badge = cop > 50000 ? 'Alto' : cop > 20000 ? 'Medio' : 'Bajo'
          const badgeStyle = cop > 50000 ? styles.badgeAlto : cop > 20000 ? styles.badgeMedio : styles.badgeBajo
          return (
            <View key={d.id} style={styles.deviceItem}>
              <View style={styles.deviceIcon}>
                <Text style={{ fontSize: 20 }}>{d.icono}</Text>
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{d.nombre}</Text>
                <Text style={styles.deviceWatts}>{d.watts}W · {d.horas_dia}h/día · {calcKwh(d.watts, d.horas_dia).toFixed(1)} kWh/mes</Text>
              </View>
              <Text style={[styles.badge, badgeStyle]}>{badge}</Text>
              <TouchableOpacity
                style={[styles.toggle, !d.activo && styles.toggleOff]}
                onPress={() => toggleAparato(d.id, d.activo)}
              />
            </View>
          )
        })}

        <View style={styles.consumeBar}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontWeight: '600', fontSize: 12 }}>Costo estimado/mes</Text>
            <Text style={{ fontWeight: '700', color: '#1a5c3a', fontSize: 12 }}>{fmt(totalCop)}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, {
              width: `${pct}%`,
              backgroundColor: pct > 90 ? '#e05252' : pct > 70 ? '#e09052' : '#2e8b57'
            }]}/>
          </View>
          <Text style={{ fontSize: 10, color: '#6b7c74', marginTop: 4 }}>{pct}% del presupuesto mensual</Text>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={() => setShowModal(true)}>
          <Text style={styles.btnText}>+ Añadir Aparato</Text>
        </TouchableOpacity>
      </ScrollView>

      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar aparato</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ fontSize: 18, color: '#6b7c74' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <Text style={styles.inputLabel}>NOMBRE DEL APARATO</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Nevera, TV, Lavadora..."
                value={nombre}
                onChangeText={setNombre}
              />

              <Text style={styles.inputLabel}>ELIGE UNO RÁPIDO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {CATALOG.map((item, i) => (
                  <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => fillFromCatalog(item)}>
                    <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                    <Text style={styles.quickBtnText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>POTENCIA (W)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. 150"
                    value={watts}
                    onChangeText={setWatts}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>HORAS/DÍA</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. 4"
                    value={horas}
                    onChangeText={setHoras}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {kwh > 0 && (
                <View style={styles.preview}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: '#0f2e1e' }}>Consumo/mes</Text>
                    <Text style={{ fontWeight: '700', fontSize: 12 }}>{kwh.toFixed(1)} kWh</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: '#0f2e1e' }}>Costo/mes</Text>
                    <Text style={{ fontWeight: '700', fontSize: 12, color: '#1a5c3a' }}>{fmt(cop)}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700' }}>
                    {cop < 10000 ? '💚 Bajo impacto' : cop < 40000 ? '🟡 Impacto moderado' : '🔴 Alto consumo'}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 30 }}>
                <TouchableOpacity style={[styles.btnSecondary, { flex: 1 }]} onPress={() => setShowModal(false)}>
                  <Text style={{ color: '#1a5c3a', fontWeight: '600', textAlign: 'center' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnPrimary, { flex: 2, marginBottom: 0 }]} onPress={guardarAparato}>
                  <Text style={styles.btnText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f3' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#e8f5ee' },
  brand: { fontSize: 17, fontWeight: '700', color: '#1a5c3a' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a5c3a', alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 22, fontWeight: '300' },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: '900', color: '#1a5c3a', marginBottom: 2 },
  sub: { fontSize: 12, color: '#6b7c74', marginBottom: 12 },
  infoBanner: { backgroundColor: '#e8f5ee', borderRadius: 10, padding: 10, marginBottom: 14 },
  infoText: { fontSize: 13, color: '#0f2e1e' },
  deviceItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  deviceIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#e8f5ee', alignItems: 'center', justifyContent: 'center' },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 13, fontWeight: '600', color: '#0f2e1e' },
  deviceWatts: { fontSize: 11, color: '#6b7c74', marginTop: 1 },
  badge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeBajo: { backgroundColor: '#e8f5ee', color: '#1a5c3a' },
  badgeMedio: { backgroundColor: '#fdf3e0', color: '#e09052' },
  badgeAlto: { backgroundColor: '#fde8e8', color: '#e05252' },
  toggle: { width: 36, height: 20, borderRadius: 10, backgroundColor: '#2e8b57' },
  toggleOff: { backgroundColor: '#b2d8c4' },
  consumeBar: { backgroundColor: '#f4f9f6', borderWidth: 1, borderColor: '#b2d8c4', borderRadius: 16, padding: 14, marginVertical: 14 },
  barTrack: { height: 8, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  btnPrimary: { backgroundColor: '#1a5c3a', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 30 },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#b2d8c4', borderRadius: 16, padding: 16 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,46,30,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 24, width: '100%', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#e8f5ee', borderBottomWidth: 1, borderBottomColor: '#b2d8c4', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1a5c3a' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#1a5c3a', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#f4f9f6', borderWidth: 1.5, borderColor: '#b2d8c4', borderRadius: 16, padding: 13, fontSize: 14, marginBottom: 14 },
  quickBtn: { alignItems: 'center', padding: 10, marginRight: 8, backgroundColor: '#f4f9f6', borderWidth: 1.5, borderColor: '#b2d8c4', borderRadius: 10 },
  quickBtnText: { fontSize: 10, fontWeight: '600', color: '#1a5c3a', marginTop: 4, textAlign: 'center', maxWidth: 60 },
  preview: { backgroundColor: '#e8f5ee', borderWidth: 1.5, borderColor: '#b2d8c4', borderRadius: 10, padding: 12 },
})