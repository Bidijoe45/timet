import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForestShopModal } from '@/components/forest/ForestShopModal';
import { IsoForest, islandDimensions } from '@/components/forest/IsoForest';
import { useForestStore } from '@/features/forest/forestStore';
import { formatCompact } from '@/lib/format';
import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

export default function ForestScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const coins = useForestStore((s) => s.coins);
  const islandSize = useForestStore((s) => s.islandSize);
  const plants = useForestStore((s) => s.plants);
  const [shopOpen, setShopOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const treeCount = Object.values(plants).filter(
    (p) => p.sprite.startsWith('tree_') && p.sprite !== 'tree_withered',
  ).length;

  const dims = islandDimensions(islandSize);
  const scale = Math.min(1, (width - spacing.lg * 2) / dims.width);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.fg }]}>Forest</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            {treeCount} {treeCount === 1 ? 'tree' : 'trees'} grown
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.coins, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Ionicons name="leaf" size={16} color={colors.accent} />
            <Text style={[styles.coinsText, { color: colors.fg }]}>{formatCompact(coins)}</Text>
          </View>
          <Pressable
            onPress={() => setShopOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open seed shop"
            style={[styles.shopBtn, { backgroundColor: colors.accent }]}>
            <Ionicons name="cart" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.canvas,
          { paddingBottom: insets.bottom + spacing.xxl, minHeight: dims.height * scale + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}>
        <IsoForest
          size={islandSize}
          plants={plants}
          scale={scale}
          selectedKey={selectedKey}
          onSelectTile={(key) => setSelectedKey((cur) => (cur === key ? null : key))}
        />
      </ScrollView>

      <ForestShopModal visible={shopOpen} onClose={() => setShopOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: { fontSize: fontSize.display, fontWeight: '700', letterSpacing: -0.5 },
  sub: { fontSize: fontSize.small },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  coinsText: { fontSize: fontSize.body, fontWeight: '700', fontVariant: ['tabular-nums'] },
  shopBtn: { width: 44, height: 44, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  canvas: { alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
});
