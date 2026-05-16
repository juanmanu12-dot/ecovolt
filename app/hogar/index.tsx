import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'

export default function HogarInicio() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [totalCop, setTotalCop] = useState(0)
  const [presupuesto, setPresupuesto] = useState(250000)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nombre, presupuesto')
      .eq('id', user.id)
      .single()
    if (usuario) {
      setNombre(usuario.nombre)
      if (usuario.presupuesto) setPresupuesto(usuario.presupuesto)
    }

    const { data: aparatos } = await supabase
      .from('aparatos')
      .select('watts, horas_dia, activo')
      .eq('usuario_id', user.id)
      .eq('activo', true)

    if (aparatos) {
      const total = aparatos.reduce((s, a) => s + (a.watts / 1000) * a.horas_dia * 30 * 721, 0)
      setTotalCop(total)
    }
  }

  const pct = Math.min(100, Math.round((totalCop / presupuesto) * 100))

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.body}>
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroTitle}>¡Hola, {nombre || 'hogar'}!</Text>
            <Text style={styles.heroSub}>Controla tu consumo,{'\n'}ahorra en grande.</Text>
          </View>
          <Text style={styles.heroIcon}>🏠</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Tu consumo personal <Text style={styles.cardSub}>Este mes</Text></Text>
          <Text style={styles.cardAmount}>COP ${Math.round(totalCop).toLocaleString('es-CO')}</Text>
          <Text style={styles.cardOk}>{totalCop <= presupuesto ? '✅ Dentro del presupuesto' : '⚠️ Superaste el presupuesto'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Presupuesto mensual</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct > 90 ? '#e05252' : '#2e8b57' }]}/>
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>COP ${Math.round(totalCop).toLocaleString('es-CO')} / ${presupuesto.toLocaleString('es-CO')}</Text>
            <Text style={styles.progressText}>{pct}%</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/hogar/aparatos')}>
            <Text style={styles.quickIcon}>🔌</Text>
            <Text style={styles.quickLabel}>Aparatos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/hogar/tarifas')}>
            <Text style={styles.quickIcon}>💲</Text>
            <Text style={styles.quickLabel}>Tarifas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/hogar/reportes')}>
            <Text style={styles.quickIcon}>📊</Text>
            <Text style={styles.quickLabel}>Reportes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertCard}>
          <Text style={styles.alertText}>💡 Reduciendo 1h/día el A/C ahorras ~COP $45.000 al mes.</Text>
        </View>
      </ScrollView>
      <BottomNav tipo="hogar" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f3' },
  body: { padding: 20 },
  heroCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f5ee', borderRadius: 16, padding: 20, marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#1a5c3a', marginBottom: 4 },
  heroSub: { fontSize: 13, color: '#6b7c74', lineHeight: 18 },
  heroIcon: { fontSize: 48 },
  card: { backgroundColor: '#f4f9f6', borderWidth: 1, borderColor: '#b2d8c4', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: '#0f2e1e', marginBottom: 6 },
  cardSub: { fontSize: 11, fontWeight: '400', color: '#6b7c74' },
  cardAmount: { fontSize: 28, fontWeight: '900', color: '#1a5c3a', marginBottom: 4 },
  cardOk: { fontSize: 12, color: '#6b7c74' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f2e1e', marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: '#b2d8c4', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 11, color: '#6b7c74' },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  quickCard: { flex: 1, alignItems: 'center', gap: 6, padding: 14, backgroundColor: '#f4f9f6', borderWidth: 1.5, borderColor: '#b2d8c4', borderRadius: 16 },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#1a5c3a' },
  alertCard: { backgroundColor: '#e8f5ee', borderRadius: 10, padding: 12, marginBottom: 20 },
  alertText: { fontSize: 12, color: '#0f2e1e', lineHeight: 18 },
})