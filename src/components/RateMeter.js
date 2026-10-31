import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { percent } from '../engine/format';

// Log-scale bar so 20%, 100% and 1.000% all fit on one line.
const MAX = 2000;
const pos = (v) => Math.min(1, Math.log10(1 + Math.max(0, v)) / Math.log10(1 + MAX));

export default function RateMeter({ value, capped }) {
  const color = value <= 20 ? colors.safe : value <= 100 ? colors.caution : colors.danger;
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>Lãi suất thật / năm</Text>
      <Text style={[styles.value, { color }]}>
        {capped ? '> 1.000.000' : percent(value)}
        <Text style={styles.unit}>%</Text>
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pos(value) * 100}%`, backgroundColor: color }]} />
        {[20, 100].map((m) => (
          <View key={m} style={[styles.mark, { left: `${pos(m) * 100}%` }]} />
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { left: `${pos(20) * 100}%` }]}>20%</Text>
        <Text style={[styles.legendText, { left: `${pos(100) * 100}%` }]}>100%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  caption: { color: colors.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  unit: { fontSize: 24 },
  track: {
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surface3,
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: { height: '100%', borderRadius: radius.sm },
  mark: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.text },
  legend: { height: 16 },
  legendText: {
    position: 'absolute',
    color: colors.muted,
    fontSize: 11,
    transform: [{ translateX: -12 }],
  },
});
