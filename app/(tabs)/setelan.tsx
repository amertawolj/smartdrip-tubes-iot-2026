import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function Setelan() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Setelan</Text>
        <Text style={styles.sub}>Coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#1B7A4A', marginBottom: 8 },
  sub: { fontSize: 14, color: '#999' },
});
