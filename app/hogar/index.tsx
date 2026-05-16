import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function HogarInicio() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    const cargarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', user.id)
          .single()
        if (data) setNombre(data.nombre)
      }
    }
    cargarUsuario()
  }, [])

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Text style={styles.brand}>Evocolt</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn}>
          <Text>👤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroTitle}>¡Hola, {nombre || 'hogar'}!</Text>
            <Text style={styles.heroSub}>Controla tu consumo,{'\n'}ahorra en grande.</Text>
          </View>
          <Text style={styles.heroIcon}>🏠</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Tu consumo personal</Text>
          <Text style={styles.cardAmount}>COP $185.000</Text>
          <Text style={styles.cardOk}>✅ Dentro del presupuesto</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Presupuesto mensual</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '75%' }]}/>
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>$185k / $250k</Text>
            <Text style={styles.progressText}>75%</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/hogar/aparatos')}>
            <Text style={styles.quickIcon}>🔌</Text>
            <Text style={styles.quickLabel}>Aparatos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/hogar/reportes')}>
            <Text style={styles.quickIcon}>📊</Text>
            <Text style={styles.quickLabel}>Reportes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/hogar/simulador')}>
            <Text style={styles.quickIcon}>🔬</Text>
            <Text style={styles.quickLabel}>Simular</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertCard}>
          <Text style={styles.alertText}>💡 Reduciendo 1h/día el A/C ahorras ~COP $45.000 al mes.</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f3' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#e8f5ee' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontSize: 17, fontWeight: '700', color: '#1a5c3a' },
  avatarBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#b2d8c4', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20 },
  heroCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f5ee', borderRadius: 16, padding: 20, marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#1a5c3a', marginBottom: 4 },
  heroSub: { fontSize: 13, color: '#6b7c74', lineHeight: 18 },
  heroIcon: { fontSize: 48 },
  card: { backgroundColor: '#f4f9f6', borderWidth: 1, borderColor: '#b2d8c4', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: '#0f2e1e', marginBottom: 6 },
  cardAmount: { fontSize: 28, fontWeight: '900', color: '#1a5c3a', marginBottom: 4 },
  cardOk: { fontSize: 12, color: '#6b7c74' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f2e1e', marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: '#b2d8c4', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#2e8b57', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 11, color: '#6b7c74' },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  quickCard: { flex: 1, alignItems: 'center', gap: 6, padding: 14, backgroundColor: '#f4f9f6', borderWidth: 1.5, borderColor: '#b2d8c4', borderRadius: 16 },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#1a5c3a' },
  alertCard: { backgroundColor: '#e8f5ee', borderRadius: 10, padding: 12 },
  alertText: { fontSize: 12, color: '#0f2e1e', lineHeight: 18 },
})