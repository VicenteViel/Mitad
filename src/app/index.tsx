import { Link, useTheme } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSesion } from '@/features/auth/use-sesion';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { sesion } = useSesion();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Rumi</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Comparte gastos. Comparte responsabilidades.
      </Text>
      <Text style={{ color: colors.text, marginTop: 24 }}>{sesion?.user.email}</Text>
      <Link href="/crear-grupo" style={{ color: colors.primary, marginTop: 24 }}>
        Crear grupo
      </Link>
      <Pressable onPress={() => supabase.auth.signOut()} accessibilityRole="button">
        <Text style={{ color: colors.primary, marginTop: 12 }}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 40, fontWeight: '700' },
  subtitle: { fontSize: 16, marginTop: 8, opacity: 0.7, textAlign: 'center' },
});
