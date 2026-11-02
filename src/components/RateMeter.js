import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { percent } from '../engine/format';

// Log-scale bar measured in multiples of the 20% reference for this loan's term, so the two marks
// stay apart for any number of days and interest up to 100 times the reference still fits.
const MAX_MULTIPLE = 100;

export default function RateMeter({ value, days, principal, extra, cap20, cap100 }) {
  const unit = Math.max(cap20, 1);
  const pos = (v) => Math.min(1, Math.log10(1 + Math.max(0, v) / unit) / Math.log10(1 + MAX_MULTIPLE));
  const color = extra <= cap20 ? colors.safe : extra <= cap100 ? colors.caution : colors.danger;
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>Lãi trong {days} ngày vay</Text>
      <Text style={[styles.value, { color }]}>
        {percent(value)}
        <Text style={styles.unit}>%</Text>
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pos(extra) * 100}%`, backgroundColor: color }]} />
        {[cap20, cap100].map((m) => (
          <View key={m} style={[styles.mark, { left: `${pos(m) * 100}%` }]} />
        ))}
      </View>
      <View style={styles.legend}>
        {[cap20, cap100].map((m) => (
          <Text key={m} style={[styles.legendText, { left: `${pos(m) * 100}%` }]}>
            {percent((m / principal) * 100, 2)}%
          </Text>
        ))}
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
