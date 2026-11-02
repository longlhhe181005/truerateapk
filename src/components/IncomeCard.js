import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Row, textStyles } from './ui';
import { formatMoneyInput, parseMoney, percent, vnd } from '../engine/format';
import { DANGER_PERCENT, MAX_INCOME, incomeBurden } from '../engine/income';
import { colors } from '../theme';

const LEVEL_COLOR = { ok: colors.safe, caution: colors.caution, danger: colors.danger };

// Asked here rather than on the form: income is optional and only matters once the user sees the cost.
export default function IncomeCard({ result }) {
  const saved = result.burden?.incomeVnd;
  const [text, setText] = useState(saved ? formatMoneyInput(String(saved)) : '');
  const [income, setIncome] = useState(saved || null);
  const [error, setError] = useState(null);

  const calculate = () => {
    const value = parseMoney(text);
    if (!value || value > MAX_INCOME) {
      setError('Nhập thu nhập mỗi tháng (lớn hơn 0).');
      return;
    }
    setError(null);
    setIncome(value);
  };

  const b = income ? incomeBurden(result, income) : null;

  return (
    <Card title="So với thu nhập của bạn" icon="wallet">
      <Text style={textStyles.body}>
        Bạn có muốn nhập thu nhập mỗi tháng để biết khoản vay này lấy đi bao nhiêu phần trăm và bạn còn lại bao nhiêu
        không?
      </Text>
      <Field
        label="Thu nhập mỗi tháng"
        hint="Chỉ tính trên máy này, không gửi đi và không lưu lại."
        error={error}
        value={text}
        onChangeText={(t) => setText(formatMoneyInput(t))}
        keyboardType="number-pad"
        suffix="đ"
      />
      <Button title="Tính" icon="calculator" variant="ghost" onPress={calculate} />

      {b && (
        <View style={styles.result}>
          <Row label={b.monthly ? 'Mỗi tháng phải trả' : 'Khoản trả một lần'} value={vnd(b.paymentVnd)} />
          <Row label="Chiếm so với thu nhập" value={`${percent(b.percent)}%`} strong color={LEVEL_COLOR[b.level]} />
          <Row
            label={b.remainingVnd >= 0 ? 'Còn lại sau khi trả' : 'Còn thiếu so với thu nhập'}
            value={vnd(Math.abs(b.remainingVnd))}
            strong
            color={b.remainingVnd >= 0 ? colors.text : colors.danger}
          />
          {!b.monthly && <Text style={textStyles.muted}>Khoản trả một lần được so với thu nhập của 1 tháng.</Text>}
          {b.percent > DANGER_PERCENT && (
            <Text style={textStyles.muted}>
              {b.remainingVnd < 0
                ? 'Khoản trả lớn hơn thu nhập cả tháng, nên rất dễ phải vay thêm để trả nợ cũ hoặc bị trễ hạn.'
                : `Trả nợ chiếm hơn ${DANGER_PERCENT}% thu nhập dễ khiến bạn phải vay thêm để trả nợ cũ hoặc bị trễ hạn.`}{' '}
              Xem phần CIC bên dưới để biết trễ hạn ảnh hưởng thế nào.
            </Text>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  result: { gap: 8 },
});
