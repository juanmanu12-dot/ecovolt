import { usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  tipo: "hogar" | "estudiante" | "empresa";
}

const NAV_HOGAR = [
  { label: "Inicio", icon: "🏠", route: "/hogar" },
  { label: "Aparatos", icon: "🔌", route: "/hogar/aparatos" },
  { label: "División", icon: "👥", route: "/hogar/division" },
  { label: "Reportes", icon: "📊", route: "/hogar/reportes" },
];

const NAV_ESTUDIANTE = [
  { label: "Inicio", icon: "🏠", route: "/estudiante" },
  { label: "Aparatos", icon: "🔌", route: "/estudiante/aparatos" },
  { label: "Simular", icon: "🔬", route: "/estudiante/simulador" },
  { label: "Consejos", icon: "💡", route: "/estudiante/consejos" },
];

const NAV_EMPRESA = [
  { label: "Inicio", icon: "🏠", route: "/empresa" },
  { label: "Áreas", icon: "🏭", route: "/empresa/areas" },
  { label: "Costos", icon: "💰", route: "/empresa/costos" },
  { label: "Reportes", icon: "📊", route: "/empresa/reportes" },
];

export default function BottomNav({ tipo }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const items =
    tipo === "hogar"
      ? NAV_HOGAR
      : tipo === "estudiante"
        ? NAV_ESTUDIANTE
        : NAV_EMPRESA;

  return (
    <View style={styles.nav}>
      {items.map((item, i) => {
        const active = pathname === item.route;
        return (
          <TouchableOpacity
            key={i}
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={[styles.navIcon, active && styles.navIconActive]}>
              {item.icon}
            </Text>
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#fff",
  },
  navItem: { alignItems: "center", gap: 3 },
  navIcon: { fontSize: 20 },
  navIconActive: { transform: [{ scale: 1.1 }] },
  navLabel: { fontSize: 10, color: "#6b7c74", fontWeight: "500" },
  navLabelActive: { color: "#2e8b57", fontWeight: "700" },
});
