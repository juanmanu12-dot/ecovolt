import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useFocusEffect } from 'expo-router'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'

const EMPRESAS: Record<string, {
  nombre: string, region: string,
  tarifas: Record<number, { tarifa: number, subsidio: number }>
}> = {
  EPM: {
    nombre: 'EPM', region: 'Antioquia',
    tarifas: {
      1: { tarifa: 612, subsidio: 60 },
      2: { tarifa: 718, subsidio: 40 },
      3: { tarifa: 821, subsidio: 15 },
      4: { tarifa: 965, subsidio: 0 },
      5: { tarifa: 1124, subsidio: 0 },
      6: { tarifa: 1124, subsidio: 0 },
    }
  },
  Codensa: {
    nombre: 'Codensa', region: 'Bogotá y Cundinamarca',
    tarifas: {
      1: { tarifa: 598, subsidio: 60 },
      2: { tarifa: 701, subsidio: 40 },
      3: { tarifa: 812, subsidio: 15 },
      4: { tarifa: 952, subsidio: 0 },
      5: { tarifa: 1108, subsidio: 0 },
      6: { tarifa: 1108, subsidio: 0 },
    }
  },
  ESSA: {
    nombre: 'ESSA', region: 'Santander',
    tarifas: {
      1: { tarifa: 580, subsidio: 60 },
      2: { tarifa: 682, subsidio: 40 },
      3: { tarifa: 795, subsidio: 15 },
      4: { tarifa: 934, subsidio: 0 },
      5: { tarifa: 1087, subsidio: 0 },
      6: { tarifa: 1087, subsidio: 0 },
    }
  },
  Electricaribe: {
    nombre: 'Electricaribe', region: 'Costa Caribe',
    tarifas: {
      1: { tarifa: 620, subsidio: 60 },
      2: { tarifa: 728, subsidio: 40 },
      3: { tarifa: 841, subsidio: 15 },
      4: { tarifa: 987, subsidio: 0 },
      5: { tarifa: 1148, subsidio: 0 },
      6: { tarifa: 1148, subsidio: 0 },
    }
  },
  EMCALI: {
    nombre: 'EMCALI', region: 'Cali y Valle del Cauca',
    tarifas: {
      1: { tarifa: 595, subsidio: 60 },
      2: { tarifa: 698, subsidio: 40 },
      3: { tarifa: 808, subsidio: 15 },
      4: { tarifa: 948, subsidio: 0 },
      5: { tarifa: 1103, subsidio: 0 },
      6: { tarifa: 1103, subsidio: 0 },
    }
  },
  EdeQ: {
    nombre: 'EdeQ', region: 'Quindío',
    tarifas: {
      1: { tarifa: 605, subsidio: 60 },
      2: { tarifa: 710, subsidio: 40 },
      3: { tarifa: 820, subsidio: 15 },
      4: { tarifa: 962, subsidio: 0 },
      5: { tarifa: 1119, subsidio: 0 },
      6: { tarifa: 1119, subsidio: 0 },
    }
  },
  CHEC: {
    nombre: 'CHEC', region: 'Caldas',
    tarifas: {
      1: { tarifa: 608, subsidio: 60 },
      2: { tarifa: 714, subsidio: 40 },
      3: { tarifa: 824, subsidio: 15 },
      4: { tarifa: 967, subsidio: 0 },
      5: { tarifa: 1125, subsidio: 0 },
      6: { tarifa: 1125, subsidio: 0 },
    }
  },
  CENS: {
    nombre: 'CENS', region: 'Norte de Santander',
    tarifas: {
      1: { tarifa: 590, subsidio: 60 },
      2: { tarifa: 692, subsidio: 40 },
      3: { tarifa: 801, subsidio: 15 },
      4: { tarifa: 940, subsidio: 0 },
      5: { tarifa: 1093, subsidio: 0 },
      6: { tarifa: 1093, subsidio: 0 },
    }
  },
}

export default function Tarifas() {
  const [estrato, setEstrato] = useState(3)
  const [empresa, setEmpresa] = useState('EPM')
  const [nombre, setNombre] = useState('')

  useFocusEffect(useCallback(() => { cargarUsuario() }, []))

  const cargarUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('usuarios')
      .select('estrato, empresa_energia, nombre')
      .eq('id', user.id)
      .single()
    if (data) {
      if (data.estrato) setEstrato(data.estrato)
      if (data.empresa_energia && EMPRESAS[data.empresa_energia]) setEmpresa(data.empresa_energia)
      if (data.nombre) setNombre(data.nombre)
    }
  }

  const empresaData = EMPRESAS[empresa]
  const tarifaActual = empresaData.tarifas[estrato]

  return (
    <View style={styles.container}>
      <Header showBack title="Tarifas" />
      <ScrollView style={styles.body}>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tu tarifa actual · 2026</Text>
          <Text style={styles.tarifa}>
            ${tarifaActual.tarifa.toLocaleString('es-CO')}
            <Text style={styles.tarifaSub}> / kWh</Text>
          </Text>
          <Text style={styles.tarifaInfo}>{empresaData.nombre} · {empresaData.region}</Text>
          <Text style={styles.tarifaInfo}>Estrato {estrato} · Subsidio: {tarifaActual.subsidio}%</Text>
          {tarifaActual.subsidio > 0 && (
            <View style={styles.subsidioTag}>
              <Text style={styles.subsidioText}>✅ Tienes subsidio del {tarifaActual.subsidio}%</Text>
            </View>
          )}
          {tarifaActual.subsidio === 0 && (
            <View style={[styles.subsidioTag, styles.sinSubsidioTag]}>
              <Text style={[styles.subsidioText, styles.sinSubsidioText]}>ℹ️ Sin subsidio para este estrato</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tarifas por estrato · {empresaData.nombre} 2026</Text>
          {[1,2,3,4,5,6].map(e => {
            const t = empresaData.tarifas[e]
            const isActive = e === estrato
            return (
              <View key={e} style={[styles.estratoRow, isActive && styles.estratoRowActive]}>
                <Text style={[styles.estratoNum, isActive && styles.estratoNumActive]}>
                  Estrato {e} {isActive ? '← tú' : ''}
                </Text>
                <Text style={[styles.estratoTarifa, isActive && styles.estratoNumActive]}>
                  ${t.tarifa.toLocaleString('es-CO')}/kWh
                </Text>
                <Text style={[styles.estratoSubsidio, t.subsidio > 0 ? styles.conSubsidio : styles.sinSubsidio]}>
                  {t.subsidio > 0 ? `${t.subsidio}% sub.` : 'Sin sub.'}
                </Text>
              </View>
            )
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Otras empresas en Colombia</Text>
          {Object.values(EMPRESAS).map(e => (
            <View key={e.nombre} style={[styles.empresaRow, e.nombre === empresa && styles.empresaRowActive]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.empresaNombre, e.nombre === empresa && styles.estratoNumActive]}>
                  {e.nombre} {e.nombre === empresa ? '← tu empresa' : ''}
                </Text>
                <Text style={styles.empresaRegion}>{e.region}</Text>
              </View>
              <Text style={[styles.estratoTarifa, e.nombre === empresa && styles.estratoNumActive]}>
                ${e.tarifas[estrato].tarifa.toLocaleString('es-CO')}/kWh
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.alertCard}>
          <Text style={styles.alertText}>
            💡 Las tarifas son reguladas por la CREG y se actualizan mensualmente. Los valores mostrados corresponden a mayo 2026.
          </Text>
        </View>

      </ScrollView>
      <BottomNav tipo="hogar" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f3' },
  body: { padding: 20 },
  card: { backgroundColor: '#f4f9f6', borderWidth: 1, borderColor: '#b2d8c4', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f2e1e', marginBottom: 12 },
  tarifa: { fontSize: 32, fontWeight: '900', color: '#1a5c3a', marginBottom: 4 },
  tarifaSub: { fontSize: 14, color: '#6b7c74', fontWeight: '400' },
  tarifaInfo: { fontSize: 12, color: '#6b7c74', marginBottom: 2 },
  subsidioTag: { backgroundColor: '#e8f5ee', borderRadius: 8, padding: 8, marginTop: 8 },
  sinSubsidioTag: { backgroundColor: '#fdf3e0' },
  subsidioText: { fontSize: 12, fontWeight: '600', color: '#1a5c3a' },
  sinSubsidioText: { color: '#e09052' },
  estratoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  estratoRowActive: { backgroundColor: '#e8f5ee', borderRadius: 8, paddingHorizontal: 8 },
  estratoNum: { fontSize: 13, fontWeight: '600', color: '#0f2e1e', flex: 1 },
  estratoNumActive: { color: '#1a5c3a', fontWeight: '700' },
  estratoTarifa: { fontSize: 13, fontWeight: '700', color: '#0f2e1e', flex: 1, textAlign: 'center' },
  estratoSubsidio: { fontSize: 11, flex: 1, textAlign: 'right', fontWeight: '600' },
  conSubsidio: { color: '#2e8b57' },
  sinSubsidio: { color: '#6b7c74' },
  empresaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  empresaRowActive: { backgroundColor: '#e8f5ee', borderRadius: 8, paddingHorizontal: 8 },
  empresaNombre: { fontSize: 13, fontWeight: '600', color: '#0f2e1e' },
  empresaRegion: { fontSize: 11, color: '#6b7c74', marginTop: 2 },
  alertCard: { backgroundColor: '#e8f5ee', borderRadius: 10, padding: 12, marginBottom: 20 },
  alertText: { fontSize: 12, color: '#0f2e1e', lineHeight: 18 },
})
