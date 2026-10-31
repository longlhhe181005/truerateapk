import React from 'react';
import { Alert, FlatList, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RiskBadge from '../components/RiskBadge';
import { StateView, textStyles } from '../components/ui';
import useApp from '../hooks/useApp';
import { aprText } from '../engine/explainer';
import { vnd } from '../engine/format';
import { colors, levelColor, radius } from '../theme';

const confirm = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: onConfirm },
  ]);
};

const dateText = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function HistoryScreen({ navigation }) {
  const { history, saveHistory, setSaveHistory, removeCheck, clearHistory } = useApp();

  const toggle = (value) => {
    if (!value && history.length) {
      confirm('Tắt lịch sử', 'Các lần kiểm tra đã lưu sẽ bị xóa khỏi máy này.', () =>
        setSaveHistory(false)
      );
    } else {
      setSaveHistory(value);
    }
  };

  const renderItem = ({ item }) => {
    const r = item.result;
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={[styles.item, { borderLeftColor: levelColor[r.risk.level] }]}
        onPress={() => navigation.navigate('Result', { result: r })}
      >
        <View style={styles.itemHead}>
          <Text style={styles.lender} numberOfLines={1}>{r.lenderName}</Text>
          <TouchableOpacity
            hitSlop={10}
            onPress={() => confirm('Xóa lần kiểm tra', 'Xóa mục này khỏi lịch sử?', () => removeCheck(item.id))}
          >
            <Ionicons name="trash-outline" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.rate}>{aprText(r.aprPercent, r.aprCapped)}</Text>
        <Text style={textStyles.muted}>
          Nhận {vnd(r.principalVnd)} · trả {vnd(r.totalRepayVnd)} · {r.termDays} ngày
        </Text>
        <RiskBadge risk={r.risk} compact />
        <Text style={styles.date}>{dateText(r.createdAt)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={textStyles.h1}>Lịch sử</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={() => confirm('Xóa tất cả', 'Xóa toàn bộ lịch sử kiểm tra?', clearHistory)}>
            <Text style={styles.clear}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.toggle}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleTitle}>Lưu lịch sử trên máy này</Text>
          <Text style={textStyles.muted}>Mặc định tắt. Dữ liệu không bao giờ rời khỏi điện thoại.</Text>
        </View>
        <Switch
          value={saveHistory}
          onValueChange={toggle}
          trackColor={{ true: colors.accent, false: colors.surface3 }}
          thumbColor={colors.text}
        />
      </View>

      <FlatList
        data={history}
        keyExtractor={(h) => h.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <StateView
            icon={saveHistory ? 'time-outline' : 'lock-closed-outline'}
            title={saveHistory ? 'Chưa có lần kiểm tra nào' : 'Lịch sử đang tắt'}
            message={
              saveHistory
                ? 'Các lần kiểm tra mới sẽ xuất hiện ở đây.'
                : 'Bật công tắc phía trên nếu bạn muốn xem lại các khoản vay đã kiểm tra.'
            }
            action="Kiểm tra khoản vay"
            onAction={() => navigation.navigate('Check')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  clear: { color: colors.danger, fontWeight: '600' },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    marginBottom: 4,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 14,
    gap: 6,
  },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  lender: { color: colors.text, fontWeight: '700', fontSize: 15, flex: 1 },
  rate: { color: colors.accent, fontSize: 22, fontWeight: '800' },
  date: { color: colors.faint, fontSize: 12 },
});
