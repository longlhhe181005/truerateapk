import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Checkbox, Field, Segmented, textStyles } from '../components/ui';
import useLoanCheck from '../hooks/useLoanCheck';
import useDebounce from '../hooks/useDebounce';
import { readContract } from '../api/backend';
import { lenders, normalize } from '../engine/licence';
import { SIGNALS } from '../engine/risk';
import { formatMoneyInput, parseDecimal, parseMoney } from '../engine/format';
import { colors, radius } from '../theme';

const EMPTY = {
  principal: '',
  totalRepay: '',
  repaymentType: 'ONE_TIME',
  termDays: '',
  installments: '',
  lenderName: '',
  statedRate: '',
  contractAmount: '',
  income: '',
  fees: [],
  signals: [],
};

const SAMPLE = {
  ...EMPTY,
  principal: '5.000.000',
  totalRepay: '6.150.000',
  termDays: '28',
  lenderName: 'Vay Nhanh 24h',
};

const notify = (title, message) =>
  Platform.OS === 'web' ? window.alert(`${title}\n${message}`) : Alert.alert(title, message);

const intOrNull = (t) => (String(t).trim() ? parseInt(String(t).replace(/\D/g, ''), 10) || 0 : null);

/** Form strings -> the engine's input shape. */
function toInput(f) {
  const monthly = f.repaymentType === 'MONTHLY';
  return {
    principalVnd: parseMoney(f.principal),
    totalRepayVnd: parseMoney(f.totalRepay),
    repaymentType: f.repaymentType,
    termDays: monthly ? null : intOrNull(f.termDays),
    installments: monthly ? intOrNull(f.installments) : null,
    lenderName: f.lenderName,
    statedRatePercent: parseDecimal(f.statedRate),
    contractAmountVnd: parseMoney(f.contractAmount),
    monthlyIncomeVnd: parseMoney(f.income),
    fees: f.fees.map((x) => ({ name: x.name, amountVnd: parseMoney(x.amount) })),
    signals: f.signals,
  };
}

export default function CheckScreen({ navigation }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showMore, setShowMore] = useState(false);
  const [lenderFocused, setLenderFocused] = useState(false);
  const [reading, setReading] = useState(false);
  const { run, loading } = useLoanCheck();

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const setMoney = (key) => (text) => set(key)(formatMoneyInput(text));

  // Lender autocomplete from the licence list (helps users type the exact legal name).
  const lenderQuery = useDebounce(form.lenderName);
  const suggestions = useMemo(() => {
    const q = normalize(lenderQuery);
    if (q.length < 2) return [];
    return lenders
      .filter((l) => [l.name, ...(l.aliases || [])].some((a) => normalize(a).includes(q)))
      .filter((l) => l.name !== lenderQuery)
      .slice(0, 4);
  }, [lenderQuery]);

  const toggleSignal = (code) =>
    setForm((f) => ({
      ...f,
      signals: f.signals.includes(code)
        ? f.signals.filter((s) => s !== code)
        : [...f.signals, code],
    }));

  const updateFee = (i, key, value) =>
    setForm((f) => ({
      ...f,
      fees: f.fees.map((x, j) => (j === i ? { ...x, [key]: value } : x)),
    }));

  const submit = async () => {
    const input = toInput(form);
    const { errors: errs, result } = await run(input);
    if (errs) {
      setErrors(errs);
      if (errs.statedRatePercent || errs.contractAmountVnd || errs.monthlyIncomeVnd) {
        setShowMore(true);
      }
      return;
    }
    setErrors({});
    navigation.navigate('Result', { result });
  };

  // Map engine field names back to form keys for error display.
  const err = {
    principal: errors.principalVnd,
    totalRepay: errors.totalRepayVnd,
    termDays: errors.termDays,
    installments: errors.installments,
    lenderName: errors.lenderName,
    statedRate: errors.statedRatePercent,
    contractAmount: errors.contractAmountVnd,
    income: errors.monthlyIncomeVnd,
  };

  const pickPhoto = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify('Cần quyền truy cập', 'Hãy cho phép TrueRate dùng camera hoặc thư viện ảnh.');
      return;
    }
    const options = { mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: !fromCamera, selectionLimit: 6 };
    const picked = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled || !picked.assets?.length) return;

    setReading(true);
    try {
      const r = await readContract(picked.assets);
      setForm((f) => ({
        ...f,
        principal: r.principalVnd ? formatMoneyInput(r.principalVnd) : f.principal,
        totalRepay: r.totalRepayVnd ? formatMoneyInput(r.totalRepayVnd) : f.totalRepay,
        termDays: r.termDays ? String(r.termDays) : f.termDays,
        installments: r.installments ? String(r.installments) : f.installments,
        repaymentType: r.installments ? 'MONTHLY' : f.repaymentType,
        lenderName: r.lenderName || f.lenderName,
        statedRate: r.statedRatePercent ? String(r.statedRatePercent) : f.statedRate,
      }));
      notify(
        'Đã đọc ảnh',
        'Hãy đối chiếu từng ô với hợp đồng gốc trước khi bấm Kiểm tra. Ảnh không được lưu lại.'
      );
    } catch (e) {
      notify('Không đọc được ảnh', e.message);
    } finally {
      setReading(false);
    }
  };

  const monthly = form.repaymentType === 'MONTHLY';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={textStyles.h1}>Kiểm tra khoản vay</Text>
            <Text style={textStyles.muted}>Khoảng 60 giây. Không cần tài khoản.</Text>
          </View>

          <View style={styles.photoRow}>
            <Button
              title="Chụp hợp đồng"
              icon="camera"
              variant="ghost"
              style={{ flex: 1 }}
              loading={reading}
              onPress={() => pickPhoto(true)}
            />
            <Button
              title="Chọn ảnh"
              icon="images"
              variant="ghost"
              style={{ flex: 1 }}
              disabled={reading}
              onPress={() => pickPhoto(false)}
            />
          </View>
          <Text style={textStyles.muted}>
            Che thông tin cá nhân (tên, số CCCD, số điện thoại) trước khi chụp. Ứng dụng chỉ đọc 4 mục cần thiết.
          </Text>

          <Card>
            <Field
              label="Số tiền bạn thực nhận"
              hint="Số tiền thật sự vào tài khoản, sau khi đã bị trừ phí."
              error={err.principal}
              value={form.principal}
              onChangeText={setMoney('principal')}
              keyboardType="number-pad"
              placeholder="5.000.000"
              suffix="đ"
            />
            <Field
              label="Tổng số tiền phải trả"
              hint="Cộng tất cả các lần trả: gốc, lãi và mọi loại phí."
              error={err.totalRepay}
              value={form.totalRepay}
              onChangeText={setMoney('totalRepay')}
              keyboardType="number-pad"
              placeholder="6.150.000"
              suffix="đ"
            />

            <Text style={styles.label}>Cách trả</Text>
            <Segmented
              value={form.repaymentType}
              onChange={set('repaymentType')}
              options={[
                { value: 'ONE_TIME', label: 'Trả một lần' },
                { value: 'MONTHLY', label: 'Trả góp hằng tháng' },
              ]}
            />
            {monthly ? (
              <Field
                label="Số kỳ trả góp"
                error={err.installments}
                value={form.installments}
                onChangeText={(t) => set('installments')(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="12"
                suffix="tháng"
              />
            ) : (
              <Field
                label="Số ngày vay"
                error={err.termDays}
                value={form.termDays}
                onChangeText={(t) => set('termDays')(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="28"
                suffix="ngày"
              />
            )}

            <Field
              label="Tên bên cho vay"
              hint="Ghi đúng tên pháp lý trên hợp đồng hoặc tên ứng dụng."
              error={err.lenderName}
              value={form.lenderName}
              onChangeText={set('lenderName')}
              onFocus={() => setLenderFocused(true)}
              onBlur={() => setTimeout(() => setLenderFocused(false), 150)}
              placeholder="VD: FE Credit"
              autoCorrect={false}
            />
            {lenderFocused && suggestions.length > 0 && (
              <View style={styles.suggestions}>
                {suggestions.map((l) => (
                  <TouchableOpacity
                    key={l.name}
                    style={styles.suggestion}
                    activeOpacity={0.7}
                    onPress={() => {
                      set('lenderName')(l.name);
                      setLenderFocused(false);
                    }}
                  >
                    <Ionicons name="shield-checkmark" size={14} color={colors.safe} />
                    <Text style={styles.suggestionText}>{l.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>

          <TouchableOpacity
            style={styles.moreToggle}
            activeOpacity={0.7}
            onPress={() => setShowMore((v) => !v)}
          >
            <Text style={styles.moreText}>Thông tin thêm (không bắt buộc)</Text>
            <Ionicons name={showMore ? 'chevron-up' : 'chevron-down'} size={18} color={colors.accent} />
          </TouchableOpacity>

          {showMore && (
            <>
              <Card title="Đối chiếu hợp đồng" icon="document-text">
                <Field
                  label="Lãi suất ghi trên hợp đồng"
                  hint="Dùng để tìm chi phí ẩn mà không khoản phí nào giải thích được."
                  error={err.statedRate}
                  value={form.statedRate}
                  onChangeText={set('statedRate')}
                  keyboardType="decimal-pad"
                  placeholder="18"
                  suffix="%/năm"
                />
                <Field
                  label="Số tiền vay ghi trên hợp đồng"
                  hint="Nếu lớn hơn số bạn thực nhận, phần chênh đã bị trừ trước."
                  error={err.contractAmount}
                  value={form.contractAmount}
                  onChangeText={setMoney('contractAmount')}
                  keyboardType="number-pad"
                  suffix="đ"
                />
                <Text style={styles.label}>Các khoản phí</Text>
                {form.fees.map((fee, i) => (
                  <View key={i} style={styles.feeRow}>
                    <Field
                      label=""
                      style={{ flex: 1.3 }}
                      value={fee.name}
                      onChangeText={(t) => updateFee(i, 'name', t)}
                      placeholder="Tên phí"
                    />
                    <Field
                      label=""
                      style={{ flex: 1 }}
                      value={fee.amount}
                      onChangeText={(t) => updateFee(i, 'amount', formatMoneyInput(t))}
                      keyboardType="number-pad"
                      placeholder="Số tiền"
                    />
                    <TouchableOpacity
                      hitSlop={8}
                      onPress={() =>
                        setForm((f) => ({ ...f, fees: f.fees.filter((_, j) => j !== i) }))
                      }
                    >
                      <Ionicons name="close-circle" size={22} color={colors.muted} />
                    </TouchableOpacity>
                  </View>
                ))}
                {form.fees.length < 8 && (
                  <TouchableOpacity
                    style={styles.addFee}
                    onPress={() =>
                      setForm((f) => ({ ...f, fees: [...f.fees, { name: '', amount: '' }] }))
                    }
                  >
                    <Ionicons name="add-circle" size={18} color={colors.accent} />
                    <Text style={{ color: colors.accent, fontWeight: '600' }}>Thêm khoản phí</Text>
                  </TouchableOpacity>
                )}
              </Card>

              <Card title="Dấu hiệu đáng ngờ" icon="eye">
                {Object.entries(SIGNALS).map(([code, text]) => (
                  <Checkbox
                    key={code}
                    checked={form.signals.includes(code)}
                    label={text}
                    onToggle={() => toggleSignal(code)}
                  />
                ))}
              </Card>

              <Card title="Khả năng trả nợ" icon="wallet">
                <Field
                  label="Thu nhập mỗi tháng"
                  hint="Chỉ dùng để tính tỷ lệ tiền trả so với thu nhập."
                  error={err.income}
                  value={form.income}
                  onChangeText={setMoney('income')}
                  keyboardType="number-pad"
                  suffix="đ"
                />
              </Card>
            </>
          )}

          <Button title="Kiểm tra" icon="calculator" loading={loading} onPress={submit} />
          <View style={styles.secondary}>
            <TouchableOpacity onPress={() => { setForm(SAMPLE); setErrors({}); }}>
              <Text style={styles.link}>Dùng số liệu mẫu</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setForm(EMPTY); setErrors({}); }}>
              <Text style={[styles.link, { color: colors.muted }]}>Xóa form</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  photoRow: { flexDirection: 'row', gap: 10 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  suggestions: {
    backgroundColor: colors.surface3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: -4,
  },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  suggestionText: { color: colors.text, flex: 1 },
  moreToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  moreText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addFee: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  secondary: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 16 },
  link: { color: colors.accent, fontWeight: '600' },
});
