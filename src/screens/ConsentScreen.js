import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Bullet, Button, Card, Checkbox, textStyles } from '../components/ui';
import useApp from '../hooks/useApp';
import { colors } from '../theme';

// US-04: consent before any data is processed.
export default function ConsentScreen() {
  const { consent } = useApp();
  const [agreed, setAgreed] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logo}>
          <Ionicons name="shield-half" size={40} color={colors.accent} />
        </View>
        <Text style={styles.brand}>TrueRate · Lãi Suất Thật</Text>
        <Text style={styles.headline}>
          Lãi suất họ quảng cáo.{'\n'}
          <Text style={{ color: colors.muted }}>Lãi suất bạn thực sự trả.</Text>
        </Text>
        <Text style={textStyles.muted}>
          Nhập 4 con số trong hợp đồng vay để biết lãi thật trong đúng số ngày vay, bên cho vay có trong danh
          sách cấp phép hay không, và nên làm gì tiếp theo.
        </Text>

        <Card title="Trước khi bắt đầu" icon="lock-closed">
          <Bullet>Không cần tài khoản, không hỏi CMND/CCCD hay số điện thoại.</Bullet>
          <Bullet>Phép tính chạy ngay trên điện thoại của bạn.</Bullet>
          <Bullet>
            Lịch sử kiểm tra mặc định tắt. Nếu bạn bật, dữ liệu chỉ lưu trên máy này và xóa được bất cứ lúc nào.
          </Bullet>
          <Bullet>
            Mỗi lần kiểm tra, số liệu khoản vay và tên bên cho vay được gửi qua máy chủ TrueRate tới nhà cung cấp
            AI (OpenAI) để viết phần giải thích. TrueRate không lưu lại các số liệu này.
          </Bullet>
          <Bullet>
            Nếu bạn dùng tính năng đọc ảnh, ảnh hợp đồng cũng được gửi theo đường đó. Hãy che thông tin cá nhân trên
            ảnh trước khi gửi.
          </Bullet>
          <Bullet>
            Kết quả chỉ để tham khảo, không thay thế tư vấn pháp lý và không xác minh hợp đồng có thật hay không.
          </Bullet>
        </Card>

        <Checkbox
          checked={agreed}
          onToggle={() => setAgreed((v) => !v)}
          label="Tôi đã đọc và đồng ý với cách TrueRate sử dụng dữ liệu như trên."
        />
        <Button title="Bắt đầu" icon="arrow-forward" disabled={!agreed} onPress={consent} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  brand: { color: colors.accent, fontWeight: '700', letterSpacing: 0.5 },
  headline: { color: colors.text, fontSize: 28, fontWeight: '800', lineHeight: 36 },
});
