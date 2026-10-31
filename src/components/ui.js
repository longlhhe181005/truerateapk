// Small shared building blocks.
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export function Card({ title, icon, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.cardHead}>
          {icon ? <Ionicons name={icon} size={18} color={colors.accent} /> : null}
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Field({ label, hint, error, suffix, style, inputRef, ...input }) {
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputBox, error && { borderColor: colors.danger }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholderTextColor={colors.faint}
          {...input}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Button({ title, icon, onPress, variant = 'primary', loading, disabled, style }) {
  const primary = variant === 'primary';
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonGhost,
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.bg : colors.accent} />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={18} color={primary ? colors.bg : colors.accent} />
          ) : null}
          <Text style={[styles.buttonText, { color: primary ? colors.bg : colors.accent }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            activeOpacity={0.75}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(o.value)}
          >
            <Text style={[styles.segmentText, active && { color: colors.bg }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Checkbox({ checked, label, onToggle }) {
  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.checkRow} onPress={onToggle}>
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={22}
        color={checked ? colors.accent : colors.muted}
      />
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Row({ label, value, strong, color }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && { fontWeight: '800' }, color && { color }]}>
        {value}
      </Text>
    </View>
  );
}

export function Bullet({ children }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

export function StateView({ icon = 'file-tray-outline', title, message, action, onAction }) {
  return (
    <View style={styles.state}>
      <Ionicons name={icon} size={52} color={colors.faint} />
      {title ? <Text style={styles.stateTitle}>{title}</Text> : null}
      {message ? <Text style={styles.stateMessage}>{message}</Text> : null}
      {action ? <Button title={action} onPress={onAction} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

export const textStyles = StyleSheet.create({
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  h1: { color: colors.text, fontSize: 26, fontWeight: '800' },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  field: { gap: 6 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 12 },
  suffix: { color: colors.muted, fontSize: 14, marginLeft: 6 },
  hint: { color: colors.faint, fontSize: 12 },
  error: { color: colors.danger, fontSize: 12 },
  button: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonGhost: { borderWidth: 1, borderColor: colors.accent, backgroundColor: 'transparent' },
  buttonText: { fontSize: 16, fontWeight: '700' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.muted, fontWeight: '600' },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 },
  checkLabel: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: colors.muted, fontSize: 14, flexShrink: 1 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  bullet: { flexDirection: 'row', gap: 8 },
  bulletDot: { color: colors.accent, fontSize: 15, lineHeight: 22 },
  body: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  stateMessage: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
