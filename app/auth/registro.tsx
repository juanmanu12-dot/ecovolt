import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function Registro() {
  const router = useRouter();
  const { tipo } = useLocalSearchParams();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [loading, setLoading] = useState(false);

  const registrar = async () => {
    if (!nombre || !email || !password || !ciudad) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert("Error", error.message);
      setLoading(false);
      return;
    }

    await supabase.from("usuarios").insert({
      id: data.user?.id,
      nombre,
      tipo_cuenta: tipo,
      ciudad,
    });

    setLoading(false);
    if (tipo === "hogar") router.replace("/hogar");
    else if (tipo === "estudiante") router.replace("/estudiante");
    else router.replace("/empresa");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Evocolt</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.sub}>
          Perfil:{" "}
          {tipo === "hogar"
            ? "🏠 Hogar"
            : tipo === "estudiante"
              ? "🎓 Estudiante"
              : "🏢 Empresa"}
        </Text>

        <Text style={styles.label}>NOMBRE</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
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

        <TouchableOpacity
          style={styles.btn}
          onPress={registrar}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f3" },
  header: {
    backgroundColor: "#e8f5ee",
    alignItems: "center",
    paddingVertical: 30,
    paddingTop: 60,
  },
  brand: { fontSize: 24, fontWeight: "700", color: "#1a5c3a" },
  body: { padding: 24 },
  title: { fontSize: 26, fontWeight: "900", color: "#1a5c3a", marginBottom: 4 },
  sub: { fontSize: 13, color: "#6b7c74", marginBottom: 24 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1a5c3a",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#f4f9f6",
    borderWidth: 1.5,
    borderColor: "#b2d8c4",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: "#1a5c3a",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  link: { textAlign: "center", color: "#2e8b57", marginTop: 16, fontSize: 13 },
});
