import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, levelColor, levelIcon, radius } from '../theme';

export default function RiskBadge({ risk, compact }) {
  const color = levelColor[risk.level] || colors.neutral;
  if (compact) {
    return (
      <View style={[styles.pill, { borderColor: color }]}>
        <Ionicons name={levelIcon[risk.level]} size={12} color={color} />
        <Text style={[styles.pillText, { color }]} numberOfLines={1}>
          {risk.title}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.box, { borderColor: color, backgroundColor: `${color}1f` }]}>
      <View style={styles.head}>
        <Ionicons name={levelIcon[risk.level]} size={22} color={color} />
        <Text style={[styles.title, { color }]}>{risk.title}</Text>
      </View>
      <Text style={styles.message}>{risk.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.lg, padding: 14, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '800' },
  message: { color: colors.text, fontSize: 14, lineHeight: 21 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  pillText: { fontSize: 11, fontWeight: '700', flexShrink: 1 },
});
