import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StateView, textStyles } from '../components/ui';
import useDebounce from '../hooks/useDebounce';
import { lenders, listVersion, normalize } from '../engine/licence';
import { colors, radius } from '../theme';

const sorted = [...lenders].sort((a, b) => a.name.localeCompare(b.name));

// US-11: licensed lenders, searchable by name or alias.
export default function LendersScreen() {
  const [search, setSearch] = useState('');
  const query = useDebounce(search);

  const data = useMemo(() => {
    const q = normalize(query);
    if (!q) return sorted;
    return sorted.filter((l) => [l.name, ...(l.aliases || [])].some((a) => normalize(a).includes(q)));
  }, [query]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={textStyles.h1}>Bên cho vay</Text>
        <Text style={textStyles.muted}>
          {lenders.length} đơn vị · bản {listVersion}
        </Text>
      </View>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm tên ngân hàng, công ty tài chính"
          placeholderTextColor={colors.faint}
          autoCorrect={false}
        />
        {search ? (
          <TouchableOpacity hitSlop={8} onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={data}
        keyExtractor={(l) => l.name}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.notice}>
            <Ionicons name="information-circle" size={18} color={colors.caution} />
            <Text style={[textStyles.muted, { flex: 1 }]}>
              Danh sách mẫu do nhóm tổng hợp để demo, chưa đầy đủ và không phải danh sách chính thức của Ngân hàng
              Nhà nước. Không có tên ở đây không có nghĩa là chắc chắn vi phạm.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Ionicons name="shield-checkmark" size={20} color={colors.safe} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              {item.aliases?.length ? (
                <Text style={styles.aliases} numberOfLines={2}>
                  Còn gọi là: {item.aliases.join(', ')}
                </Text>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <StateView
            icon="search"
            title="Không tìm thấy"
            message={`Không có đơn vị nào khớp với "${query}". Không có trong danh sách không có nghĩa là chắc chắn vi phạm, hãy hỏi bên cho vay mã số doanh nghiệp.`}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 16, gap: 2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  notice: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(217,138,61,0.1)',
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontWeight: '700', fontSize: 15 },
  aliases: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
