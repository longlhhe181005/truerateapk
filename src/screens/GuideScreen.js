import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bullet, Button, Card, Row, textStyles } from '../components/ui';
import useApp from '../hooks/useApp';
import { API_URL, hasBackend, health } from '../api/backend';
import { DISCLAIMER, rightsForLevel } from '../engine/explainer';
import { colors } from '../theme';

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

export default function GuideScreen() {
  const { resetAll } = useApp();
  const [server, setServer] = useState({ state: hasBackend ? 'checking' : 'off' });

  const checkServer = () => {
    if (!hasBackend) return;
    setServer({ state: 'checking' });
    health()
      .then((h) => setServer({ state: 'online', ai: h.aiMode === 'online', ocr: h.ocr }))
      .catch((e) => setServer({ state: 'error', message: e.message }));
  };

  useEffect(checkServer, []);

  const serverText = {
    off: ['Chế độ ngoại tuyến', colors.neutral],
    checking: ['Đang kiểm tra...', colors.muted],
    online: ['Đã kết nối', colors.safe],
    error: ['Không kết nối được', colors.danger],
  }[server.state];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={textStyles.h1}>Hướng dẫn</Text>

        <Card title="Nếu bị đòi nợ bằng đe dọa" icon="hand-left">
          {rightsForLevel('serious').map((t) => (
            <Bullet key={t}>{t}</Bullet>
          ))}
        </Card>

        <Card title="Cách tính lãi suất thật" icon="calculator">
          <Text style={textStyles.body}>
            P là số tiền bạn thực nhận, R là tổng số phải trả, d là số ngày vay.
          </Text>
          <View style={styles.formula}>
            <Text style={styles.formulaText}>Lãi trong kỳ vay = (R − P) / P</Text>
            <Text style={styles.formulaText}>Mốc cho d ngày = P × mốc %/năm × d / 365</Text>
          </View>
          <Text style={textStyles.muted}>
            Ứng dụng chỉ tính lãi trên đúng số ngày vay, không quy ra năm. Mốc tham khảo 20%/năm (Bộ luật Dân sự) và
            100%/năm được luật nêu theo năm, nên được đổi về d ngày rồi so với tiền lãi bạn phải trả. Với trả góp, mốc
            là tổng lãi của các kỳ trả đều, tính trên dư nợ giảm dần.
          </Text>
          <Text style={textStyles.muted}>
            Mọi con số và nhãn đều do code quyết định. AI (nếu bật) chỉ diễn đạt lại kết quả cho dễ hiểu.
          </Text>
        </Card>

        <Card title="Quyền riêng tư" icon="lock-closed">
          <Bullet>Không hỏi tên, CCCD, số điện thoại. Không cần tài khoản.</Bullet>
          <Bullet>Phép tính chạy trên máy. Lịch sử chỉ lưu khi bạn bật, và chỉ trên máy này.</Bullet>
          <Bullet>
            Số liệu khoản vay và tên bên cho vay được gửi qua máy chủ TrueRate tới nhà cung cấp AI (OpenAI) để viết phần
            giải thích.
          </Bullet>
          <Bullet>
            Ảnh hợp đồng cũng đi theo đường đó để đọc 4 mục cần thiết. TrueRate không lưu lại ảnh, nhưng bạn nên che
            thông tin cá nhân trên ảnh trước khi gửi.
          </Bullet>
        </Card>

        <Card title="Máy chủ AI" icon="server">
          <Row label="Trạng thái" value={serverText[0]} color={serverText[1]} strong />
          {hasBackend ? (
            <>
              <Row label="Địa chỉ" value={API_URL} />
              {server.state === 'online' && (
                <>
                  <Row label="AI giải thích" value={server.ai ? 'Bật' : 'Mẫu cố định'} />
                  <Row label="Đọc ảnh hợp đồng" value={server.ocr ? 'Bật' : 'Tắt'} />
                </>
              )}
              {server.state === 'error' && <Text style={textStyles.muted}>{server.message}</Text>}
              <Button title="Kiểm tra lại" icon="refresh" variant="ghost" onPress={checkServer} />
            </>
          ) : (
            <Text style={textStyles.muted}>
              Ứng dụng vẫn tính đầy đủ khi không có máy chủ; phần giải thích dùng mẫu soạn sẵn và chưa đọc được ảnh.
            </Text>
          )}
        </Card>

        <Button
          title="Xóa toàn bộ dữ liệu trên máy"
          icon="trash"
          variant="ghost"
          onPress={() =>
            confirm(
              'Xóa toàn bộ dữ liệu',
              'Lịch sử, cài đặt và lựa chọn đồng ý sẽ bị xóa. Bạn sẽ thấy lại màn hình giới thiệu.',
              resetAll
            )
          }
        />
        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  formula: { backgroundColor: colors.surface2, borderRadius: 10, padding: 12, gap: 6 },
  formulaText: {
    color: colors.accentStrong,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
  },
  disclaimer: { color: colors.faint, fontSize: 12, textAlign: 'center', paddingBottom: 16 },
});
