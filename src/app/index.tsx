import { useTheme } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Mitad</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Comparte gastos. Comparte responsabilidades.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 40, fontWeight: '700' },
  subtitle: { fontSize: 16, marginTop: 8, opacity: 0.7, textAlign: 'center' },
});
