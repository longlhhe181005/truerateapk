import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Bullet, Button, Card, Row, textStyles } from '../components/ui';
import RiskBadge from '../components/RiskBadge';
import RateMeter from '../components/RateMeter';
import { aprText } from '../engine/explainer';
import { percent, vnd } from '../engine/format';
import { colors, radius } from '../theme';

const LICENCE_TEXT = {
  LICENSED: ['Có trong danh sách cấp phép', 'shield-checkmark', colors.safe],
  NOT_FOUND: ['Không thấy trong danh sách cấp phép', 'close-circle', colors.danger],
  UNDETERMINED: ['Chưa xác định chắc chắn', 'help-circle', colors.neutral],
};

const SCENARIO_STATUS = {
  MATCH: ['Khớp, không có chi phí ẩn', colors.safe],
  FEES_EXPLAIN: ['Khớp khi cộng các khoản phí bạn đã liệt kê', colors.safe],
  HIDDEN: ['Có khoản chưa được giải thích', colors.danger],
  LOWER: ['Thấp hơn mức lãi ghi trên hợp đồng', colors.muted],
};

/** US-12: anonymous result card, no lender name or amounts that identify the user. */
const shareText = (r) =>
  [
    'Mình vừa kiểm tra một khoản vay bằng TrueRate:',
    `• Trả thêm ${percent(r.extraPercent)}% so với số tiền nhận được`,
    `• Lãi suất thật: ${aprText(r.aprPercent, r.aprCapped)}`,
    `• Đánh giá: ${r.risk.title}`,
    'Biết lãi suất thật trước khi ký. TrueRate · Lãi Suất Thật',
  ].join('\n');

export default function ResultScreen({ route, navigation }) {
  const { result: r } = route.params;
  const [showSchedule, setShowSchedule] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [licenceLabel, licenceIcon, licenceColor] = LICENCE_TEXT[r.licence.status];

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <RateMeter value={r.aprPercent} capped={r.aprCapped} />
          <Text style={textStyles.muted}>
            Bạn trả thêm {vnd(r.extraCostVnd)} ({percent(r.extraPercent)}% số tiền nhận) trong {r.termDays}{' '}
            ngày. Con số {percent(r.extraPercent)}% nghe nhỏ, nhưng quy ra năm là{' '}
            {aprText(r.aprPercent, r.aprCapped)}.
          </Text>
          <Row
            label="Nếu lãi chồng lãi (đáo hạn liên tục)"
            value={r.compoundCapped ? '> 1.000.000%' : `${percent(r.compoundPercent)}%`}
          />
        </Card>

        <RiskBadge risk={r.risk} />

        <Card title="Bên cho vay" icon="business">
          <View style={styles.licence}>
            <Ionicons name={licenceIcon} size={20} color={licenceColor} />
            <Text style={[styles.licenceText, { color: licenceColor }]}>{licenceLabel}</Text>
          </View>
          <Row label="Tên bạn nhập" value={r.lenderName} />
          {r.licence.matchedName ? (
            <Row
              label={r.licence.status === 'LICENSED' ? 'Khớp với' : 'Gần giống'}
              value={r.licence.matchedName}
            />
          ) : null}
          <Text style={styles.small}>Danh sách: {r.licence.listVersion} (bản demo, không phải danh sách chính thức của NHNN)</Text>
        </Card>

        <Card title="So với mốc tham khảo" icon="scale">
          <Row label="Tiền bạn trả thêm" value={vnd(r.legalCap.actualVnd)} strong />
          <Row label="Mức lãi 20%/năm sẽ là" value={vnd(r.legalCap.cap20Vnd)} />
          <Row label="Mức lãi 100%/năm sẽ là" value={vnd(r.legalCap.cap100Vnd)} />
          {r.legalCap.multipleOf20 != null && (
            <Text style={textStyles.muted}>
              Bạn đang trả gấp {percent(r.legalCap.multipleOf20)} lần mức 20%/năm.
            </Text>
          )}
        </Card>

        {r.contractGap && (
          <Card title="Tiền bị trừ trước khi giải ngân" icon="cut">
            <Row label="Hợp đồng ghi" value={vnd(r.contractGap.contractAmountVnd)} />
            <Row label="Bạn thực nhận" value={vnd(r.principalVnd)} />
            <Row
              label="Bị trừ"
              value={`${vnd(r.contractGap.shortfallVnd)} (${percent(r.contractGap.shortfallPercent)}%)`}
              color={colors.caution}
              strong
            />
            <Text style={textStyles.muted}>
              Phần chênh có thể là phí bảo hiểm hoặc phí khác trừ vào khoản vay. Hãy yêu cầu bên cho vay giải thích
              bằng văn bản và giữ lại ảnh hợp đồng, màn hình giải ngân, sao kê.
            </Text>
          </Card>
        )}

        {r.scenarios && (
          <Card title="Đối chiếu lãi suất hợp đồng" icon="git-compare">
            <Text style={textStyles.muted}>
              Hợp đồng ghi {percent(r.statedRatePercent)}%/năm. Ứng dụng thử từng cách tính để xem có khoản nào
              không được giải thích.
            </Text>
            {r.scenarios.map((s) => {
              const [label, color] = SCENARIO_STATUS[s.status];
              return (
                <View key={s.code} style={[styles.scenario, s.best && { borderColor: colors.accent }]}>
                  <Text style={styles.scenarioTitle}>
                    {s.title} {s.best ? '· gần nhất' : ''}
                  </Text>
                  <Text style={styles.small}>{s.how}</Text>
                  <Text style={[styles.scenarioStatus, { color }]}>{label}</Text>
                  {s.status === 'HIDDEN' && (
                    <Text style={textStyles.body}>
                      Chưa giải thích: <Text style={{ color: colors.danger, fontWeight: '800' }}>{vnd(s.unexplainedVnd)}</Text>
                    </Text>
                  )}
                </View>
              );
            })}
            {r.fees && <Row label="Các khoản phí bạn liệt kê" value={vnd(r.listedFeesVnd)} />}
          </Card>
        )}

        {r.signals && (
          <Card title="Dấu hiệu bạn đã đánh dấu" icon="eye">
            {r.signals.map((s) => (
              <Bullet key={s}>{s}</Bullet>
            ))}
          </Card>
        )}

        {r.burden && (
          <Card title="So với thu nhập" icon="wallet">
            <Row
              label={r.burden.basis === 'MONTHLY' ? 'Mỗi tháng phải trả' : 'Khoản trả một lần'}
              value={vnd(r.burden.paymentVnd)}
            />
            <Row label="Thu nhập mỗi tháng" value={vnd(r.burden.incomeVnd)} />
            <Row
              label="Tỷ lệ"
              value={`${percent(r.burden.percent)}%`}
              strong
              color={r.burden.percent > 40 ? colors.danger : r.burden.percent > 30 ? colors.caution : colors.safe}
            />
            {r.burden.percent > 40 && (
              <Text style={textStyles.muted}>
                Trả nợ chiếm hơn 40% thu nhập dễ khiến bạn phải vay thêm để trả nợ cũ.
              </Text>
            )}
          </Card>
        )}

        {r.schedule && (
          <Card title={`Lịch trả góp · ${r.installments} kỳ × ${vnd(r.installmentVnd)}`} icon="calendar">
            <TouchableOpacity onPress={() => setShowSchedule((v) => !v)}>
              <Text style={styles.link}>{showSchedule ? 'Ẩn lịch trả' : 'Xem từng kỳ'}</Text>
            </TouchableOpacity>
            {showSchedule && (
              <View>
                <View style={[styles.tr, styles.th]}>
                  {['Kỳ', 'Lãi', 'Gốc', 'Còn nợ'].map((h) => (
                    <Text key={h} style={[styles.td, styles.thText]}>{h}</Text>
                  ))}
                </View>
                {r.schedule.map((row) => (
                  <View key={row.k} style={styles.tr}>
                    <Text style={styles.td}>{row.k}</Text>
                    <Text style={styles.td}>{vnd(row.interest)}</Text>
                    <Text style={styles.td}>{vnd(row.principal)}</Text>
                    <Text style={styles.td}>{vnd(row.balance)}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        <Card title="Giải thích" icon="chatbubble-ellipses">
          <View style={styles.aiChip}>
            <Ionicons
              name={r.ai?.mode === 'online' ? 'sparkles' : 'document-text-outline'}
              size={12}
              color={colors.accent}
            />
            <Text style={styles.aiChipText}>
              {r.ai?.mode === 'online' ? 'AI giải thích' : 'Giải thích soạn sẵn'}
            </Text>
          </View>
          <Text style={textStyles.body}>{r.explanation}</Text>
          <Text style={textStyles.body}>{r.legalComparison}</Text>
          <View style={styles.nextStep}>
            <Ionicons name="arrow-forward-circle" size={20} color={colors.accent} />
            <Text style={[textStyles.body, { flex: 1, fontWeight: '600' }]}>{r.nextStepText}</Text>
          </View>
        </Card>

        <Card title="Quyền của bạn" icon="hand-left">
          {r.rights.map((t) => (
            <Bullet key={t}>{t}</Bullet>
          ))}
          <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Lenders' })}>
            <Text style={styles.link}>Xem danh sách bên cho vay được cấp phép →</Text>
          </TouchableOpacity>
        </Card>

        <Card>
          <Text style={styles.feedbackTitle}>Kết quả này có dễ hiểu không?</Text>
          {feedback ? (
            <Text style={textStyles.muted}>Cảm ơn bạn đã phản hồi.</Text>
          ) : (
            <View style={styles.feedbackRow}>
              <Button title="Có" icon="thumbs-up" variant="ghost" style={{ flex: 1 }} onPress={() => setFeedback('yes')} />
              <Button title="Chưa" icon="thumbs-down" variant="ghost" style={{ flex: 1 }} onPress={() => setFeedback('no')} />
            </View>
          )}
        </Card>

        <Button
          title="Chia sẻ kết quả (ẩn danh)"
          icon="share-social"
          onPress={() => Share.share({ message: shareText(r) }).catch(() => {})}
        />
        <Text style={styles.disclaimer}>{r.disclaimer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  licence: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  licenceText: { fontSize: 16, fontWeight: '700' },
  small: { color: colors.faint, fontSize: 12, lineHeight: 17 },
  scenario: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
  },
  scenarioTitle: { color: colors.text, fontWeight: '700' },
  scenarioStatus: { fontWeight: '700' },
  link: { color: colors.accent, fontWeight: '600' },
  tr: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: { borderBottomColor: colors.muted },
  td: { flex: 1, color: colors.text, fontSize: 12 },
  thText: { color: colors.muted, fontWeight: '700' },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  aiChipText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  nextStep: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 12,
  },
  feedbackTitle: { color: colors.text, fontWeight: '700' },
  feedbackRow: { flexDirection: 'row', gap: 10 },
  disclaimer: { color: colors.faint, fontSize: 12, textAlign: 'center', paddingBottom: 12 },
});
