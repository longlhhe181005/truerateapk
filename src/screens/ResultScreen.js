import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Bullet, Button, Card, Row, textStyles } from '../components/ui';
import RiskBadge from '../components/RiskBadge';
import RateMeter from '../components/RateMeter';
import IncomeCard from '../components/IncomeCard';
import CicCard from '../components/CicCard';
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
// The backend reports who wrote the text: "openai" or "claude", or "offline" for the fixed template.
const isAiWritten = (r) => ['openai', 'claude'].includes(r.ai?.mode);

const shareText = (r) =>
  [
    'Mình vừa kiểm tra một khoản vay bằng TrueRate:',
    `• Trả thêm ${percent(r.extraPercent)}% số tiền nhận được chỉ trong ${r.termDays} ngày`,
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
          <RateMeter
            value={r.extraPercent}
            days={r.termDays}
            principal={r.principalVnd}
            extra={r.extraCostVnd}
            cap20={r.legalCap.cap20Vnd}
            cap100={r.legalCap.cap100Vnd}
          />
          <Text style={textStyles.muted}>
            Bạn trả thêm {vnd(r.extraCostVnd)} ({percent(r.extraPercent)}% số tiền nhận) trong {r.termDays} ngày. Hai
            vạch trên thanh là mốc tham khảo 20%/năm và 100%/năm đã tính cho đúng {r.termDays} ngày này.
          </Text>
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

        <Card title={`So với mốc tham khảo cho ${r.termDays} ngày`} icon="scale">
          <Row label="Tiền bạn trả thêm" value={vnd(r.legalCap.actualVnd)} strong />
          <Row label="Mốc 20%/năm, tính cho số ngày vay" value={vnd(r.legalCap.cap20Vnd)} />
          <Row label="Mốc 100%/năm, tính cho số ngày vay" value={vnd(r.legalCap.cap100Vnd)} />
          {r.legalCap.multipleOf20 != null && (
            <Text style={textStyles.muted}>
              Bạn đang trả gấp {percent(r.legalCap.multipleOf20)} lần mốc 20%/năm tính cho {r.termDays} ngày.
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
              name={isAiWritten(r) ? 'sparkles' : 'document-text-outline'}
              size={12}
              color={colors.accent}
            />
            <Text style={styles.aiChipText}>
              {isAiWritten(r) ? 'AI giải thích' : 'Giải thích soạn sẵn'}
            </Text>
          </View>
          {!isAiWritten(r) && r.ai?.note ? <Text style={textStyles.muted}>{r.ai.note}</Text> : null}
          <Text style={textStyles.body}>{r.explanation}</Text>
          <Text style={textStyles.body}>{r.legalComparison}</Text>
          <View style={styles.nextStep}>
            <Ionicons name="arrow-forward-circle" size={20} color={colors.accent} />
            <Text style={[textStyles.body, { flex: 1, fontWeight: '600' }]}>{r.nextStepText}</Text>
          </View>
        </Card>

        <IncomeCard result={r} />
        <CicCard licenceStatus={r.licence.status} />

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
