import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Bullet, Card, Row, textStyles } from './ui';
import { CIC_AFTER, CIC_BEFORE, CIC_GROUPS, CIC_NOTE, cicScope } from '../engine/cic';
import { colors } from '../theme';

export default function CicCard({ licenceStatus }) {
  return (
    <Card title="Ảnh hưởng đến CIC" icon="document-text">
      <Text style={textStyles.body}>{cicScope(licenceStatus)}</Text>

      <Text style={styles.heading}>Trước khi vay</Text>
      {CIC_BEFORE.map((t) => (
        <Bullet key={t}>{t}</Bullet>
      ))}

      <Text style={styles.heading}>Sau khi vay</Text>
      {CIC_AFTER.map((t) => (
        <Bullet key={t}>{t}</Bullet>
      ))}
      {CIC_GROUPS.map(([label, value]) => (
        <Row key={value} label={label} value={value} />
      ))}

      <Text style={textStyles.muted}>{CIC_NOTE}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontWeight: '700', marginTop: 4 },
});
