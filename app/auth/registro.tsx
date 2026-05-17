import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Registro() {
  const router = useRouter()
  const { tipo } = useLocalSearchParams()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [estrato, setEstrato] = useState('')
  const [empresaEnergia, setEmpresaEnergia] = useState('')
  const [universidad, setUniversidad] = useState('')
  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [loading, setLoading] = useState(false)

  const registrar = async () => {
    if (!nombre || !email || !password || !ciudad) {
      Alert.alert('Error', 'Completa todos los campos obligatorios')
      return
    }
    if (tipo === 'hogar' && !estrato) {
      Alert.alert('Error', 'Selecciona tu estrato')
      return
    }
    if (tipo === 'estudiante' && !universidad) {
      Alert.alert('Error', 'Ingresa tu universidad o institución')
      return
    }
    if (tipo === 'empresa' && !nombreEmpresa) {
      Alert.alert('Error', 'Ingresa el nombre de tu empresa')
      return
    }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { Alert.alert('Error', error.message); setLoading(false); return }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) { Alert.alert('Error', loginError.message); setLoading(false); return }

    const { error: dbError } = await supabase.from('usuarios').insert({
      id: data.user?.id,
      nombre,
      tipo_cuenta: tipo,
      ciudad,
      estrato: estrato ? parseInt(estrato) : null,
      empresa_energia: empresaEnergia || null,
      universidad: universidad || null,
      nombre_empresa: nombreEmpresa || null,
    })

    if (dbError) { Alert.alert('Error al guardar datos', dbError.message); setLoading(false); return }

    if (tipo === 'estudiante') {
      await supabase.from('aparatos').upsert([
        { usuario_id: data.user?.id, nombre: 'Laptop', icono: '💻', watts: 60, horas_dia: 4, activo: true },
        { usuario_id: data.user?.id, nombre: 'Cargador celular', icono: '📱', watts: 5, horas_dia: 3, activo: true },
        { usuario_id: data.user?.id, nombre: 'Ventilador', icono: '🌀', watts: 45, horas_dia: 6, activo: true },
        { usuario_id: data.user?.id, nombre: 'Microondas', icono: '📻', watts: 700, horas_dia: 0.5, activo: false },
        { usuario_id: data.user?.id, nombre: 'Lámpara LED', icono: '💡', watts: 10, horas_dia: 5, activo: true },
      ], { onConflict: 'usuario_id,nombre' })
    }

    setLoading(false)
    if (tipo === 'hogar') router.replace('/hogar')
    else if (tipo === 'estudiante') router.replace('/estudiante')
    else router.replace('/empresa')
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Evocolt</Text>
      </View>
      <View style={styles.body}>
        <TouchableOpacity style={styles.volverBtn} onPress={() => router.back()}>
          <Text style={styles.volverText}>← Cambiar tipo de cuenta</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.sub}>
          Perfil: {tipo === 'hogar' ? '🏠 Hogar' : tipo === 'estudiante' ? '🎓 Estudiante' : '🏢 Empresa'}
        </Text>

        <Text style={styles.label}>NOMBRE COMPLETO</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre completo"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>CORREO</Text>
        <TextInput
          style={styles.input}
          placeholder="correo@ejemplo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>CIUDAD</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Medellín"
          value={ciudad}
          onChangeText={setCiudad}
        />

        {tipo === 'estudiante' && (
          <>
            <Text style={styles.label}>UNIVERSIDAD O INSTITUCIÓN</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Universidad EAFIT"
              value={universidad}
              onChangeText={setUniversidad}
            />
          </>
        )}

        {tipo === 'hogar' && (
          <>
            <Text style={styles.label}>ESTRATO</Text>
            <View style={styles.estratoRow}>
              {['1','2','3','4','5','6'].map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.estratoBtn, estrato === e && styles.estratoBtnActive]}
                  onPress={() => setEstrato(e)}
                >
                  <Text style={[styles.estratoBtnText, estrato === e && styles.estratoBtnTextActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>EMPRESA DE ENERGÍA</Text>
            <View style={styles.empresaRow}>
              {['EPM','Codensa','ESSA','Electricaribe','EMCALI','EdeQ','CHEC','CENS'].map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.empresaBtn, empresaEnergia === e && styles.estratoBtnActive]}
                  onPress={() => setEmpresaEnergia(e)}
                >
                  <Text style={[styles.empresaBtnText, empresaEnergia === e && styles.estratoBtnTextActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {tipo === 'empresa' && (
          <>
            <Text style={styles.label}>NOMBRE DE LA EMPRESA</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Empresa Verde S.A.S"
              value={nombreEmpresa}
              onChangeText={setNombreEmpresa}
            />

            <Text style={styles.label}>EMPRESA DE ENERGÍA</Text>
            <View style={styles.empresaRow}>
              {['EPM','Codensa','ESSA','Electricaribe','EMCALI','EdeQ','CHEC','CENS'].map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.empresaBtn, empresaEnergia === e && styles.estratoBtnActive]}
                  onPress={() => setEmpresaEnergia(e)}
                >
                  <Text style={[styles.empresaBtnText, empresaEnergia === e && styles.estratoBtnTextActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.btn} onPress={registrar} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f3' },
  header: { backgroundColor: '#e8f5ee', alignItems: 'center', paddingVertical: 30, paddingTop: 60 },
  brand: { fontSize: 24, fontWeight: '700', color: '#1a5c3a' },
  body: { padding: 24 },
  volverBtn: { marginBottom: 16, padding: 10 },
  volverText: { fontSize: 13, color: '#2e8b57', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '900', color: '#1a5c3a', marginBottom: 4 },
  sub: { fontSize: 13, color: '#6b7c74', marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '600', color: '#1a5c3a', letterSpacing: 0.5, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#f4f9f6', borderWidth: 1.5, borderColor: '#b2d8c4', borderRadius: 16, padding: 14, fontSize: 14, marginBottom: 14 },
  estratoRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  estratoBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#b2d8c4', backgroundColor: '#f4f9f6', alignItems: 'center', justifyContent: 'center' },
  estratoBtnActive: { backgroundColor: '#1a5c3a', borderColor: '#1a5c3a' },
  estratoBtnText: { fontSize: 14, fontWeight: '600', color: '#1a5c3a' },
  estratoBtnTextActive: { color: '#fff' },
  empresaRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  empresaBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#b2d8c4', backgroundColor: '#f4f9f6' },
  empresaBtnText: { fontSize: 12, fontWeight: '600', color: '#1a5c3a' },
  btn: { backgroundColor: '#1a5c3a', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  link: { textAlign: 'center', color: '#2e8b57', marginTop: 16, fontSize: 13, marginBottom: 30 },
})