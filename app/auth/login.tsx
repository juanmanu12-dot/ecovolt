import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completa todos los campos')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { Alert.alert('Error', error.message); setLoading(false); return }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tipo_cuenta')
      .eq('id', data.user.id)
      .single()

    setLoading(false)
    const tipo = usuario?.tipo_cuenta
    if (tipo === 'hogar') router.replace('/hogar')
    else if (tipo === 'estudiante') router.replace('/estudiante')
    else router.replace('/empresa')
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Evocolt</Text>
        <Text style={styles.sub}>Tu aliado para ahorrar energía</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Iniciar sesión</Text>

        <Text style={styles.label}>CORREO</Text>
        <TextInput style={styles.input} placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>

        <Text style={styles.label}>CONTRASEÑA</Text>
        <TextInput style={styles.input} placeholder="Tu contraseña" value={password} onChangeText={setPassword} secureTextEntry/>

        <TouchableOpacity style={styles.btn} onPress={login} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Entrando...' : 'Iniciar sesión'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/tipo-cuenta')}>
          <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f3' },
  header: { backgroundColor: '#e8f5ee', alignItems: 'center', paddingVertical: 40, paddingTop: 60 },
  brand: { fontSize: 24, fontWeight: '700', color: '#1a5c3a' },
  sub: { fontSize: 13, color: '#6b7c74', marginTop: 4 },
  body: { padding: 24 },
  title: { fontSize: 26, fontWeight: '900', color: '#1a5c3a', marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '600', color: '#1a5c3a', letterSpacing: 0.5, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#f4f9f6', borderWidth: 1.5, borderColor: '#b2d8c4', borderRadius: 16, padding: 14, fontSize: 14, marginBottom: 14 },
  btn: { backgroundColor: '#1a5c3a', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  link: { textAlign: 'center', color: '#2e8b57', marginTop: 16, fontSize: 13 },
})


