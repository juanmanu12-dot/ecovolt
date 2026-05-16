import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

interface Props {
  title?: string
  showBack?: boolean
  showMenu?: boolean
}

export default function Header({ title, showBack = false, showMenu = true }: Props) {
  const router = useRouter()

  const cerrarSesion = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/auth/login')
        }
      }
    ])
  }

  const cambiarCuenta = async () => {
    Alert.alert('Cambiar cuenta', '¿Quieres cambiar de tipo de cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cambiar',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/auth/tipo-cuenta')
        }
      }
    ])
  }

  return (
    <View style={styles.topBar}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <Text style={styles.brand}>Evocolt</Text>
        )}
      </View>

      {showMenu && (
        <View style={styles.right}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => {
            Alert.alert('Mi cuenta', '', [
              { text: '🔄 Cambiar cuenta', onPress: cambiarCuenta },
              { text: '🚪 Cerrar sesión', onPress: cerrarSesion, style: 'destructive' },
              { text: 'Cancelar', style: 'cancel' },
            ])
          }}>
            <Text style={styles.menuIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#e8f5ee' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#b2d8c4' },
  backText: { fontSize: 18, color: '#1a5c3a' },
  brand: { fontSize: 17, fontWeight: '700', color: '#1a5c3a' },
  title: { fontSize: 16, fontWeight: '700', color: '#0f2e1e' },
  right: { flexDirection: 'row', gap: 8 },
  menuBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#b2d8c4', alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 16 },
})



