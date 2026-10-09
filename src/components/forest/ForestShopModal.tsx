import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TreeThumb } from '@/components/forest/TreeThumb';
import { PLANTABLE_TREES, TREE_COST, TREE_LABELS, type TreeName } from '@/features/forest/forestConfig';
import { useForestStore } from '@/features/forest/forestStore';
import { formatCompact } from '@/lib/format';
import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

interface ForestShopModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ForestShopModal({ visible, onClose }: ForestShopModalProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const coins = useForestStore((s) => s.coins);
  const unlockedTrees = useForestStore((s) => s.unlockedTrees);
  const buyTree = useForestStore((s) => s.buyTree);

  const onBuy = (name: TreeName) => {
    if (coins < TREE_COST[name]) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    buyTree(name);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.bg, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.fg }]}>Seed shop</Text>
            <View style={styles.coins}>
              <Ionicons name="leaf" size={16} color={colors.accent} />
              <Text style={[styles.coinsVal, { color: colors.accent }]}>{formatCompact(coins)}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {PLANTABLE_TREES.map((name) => {
              const owned = unlockedTrees.includes(name);
              const cost = TREE_COST[name];
              const affordable = coins >= cost;
              return (
                <View key={name} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <View style={styles.thumb}>
                    <TreeThumb name={name} height={56} />
                  </View>
                  <Text style={[styles.name, { color: colors.fg }]}>{TREE_LABELS[name]}</Text>
                  {owned ? (
                    <View style={[styles.owned, { borderColor: colors.line }]}>
                      <Text style={[styles.ownedText, { color: colors.muted }]}>Owned</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => onBuy(name)}
                      disabled={!affordable}
                      accessibilityRole="button"
                      accessibilityLabel={`Buy ${TREE_LABELS[name]} for ${cost} seeds`}
                      style={({ pressed }) => [
                        styles.buy,
                        { backgroundColor: affordable ? colors.accent : colors.surfaceAlt, opacity: pressed && affordable ? 0.85 : 1 },
                      ]}>
                      <Ionicons name="leaf" size={13} color={affordable ? '#ffffff' : colors.muted} />
                      <Text style={[styles.buyText, { color: affordable ? '#ffffff' : colors.muted }]}>
                        {formatCompact(cost)}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    maxHeight: '80%',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  title: { fontSize: fontSize.title, fontWeight: '700', flex: 1 },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: spacing.sm },
  coinsVal: { fontSize: fontSize.body, fontWeight: '700', fontVariant: ['tabular-nums'] },
  list: { gap: spacing.sm, paddingBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  thumb: { width: 48, alignItems: 'center' },
  name: { flex: 1, fontSize: fontSize.body, fontWeight: '600' },
  owned: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.sm, borderWidth: 1 },
  ownedText: { fontSize: fontSize.small, fontWeight: '600' },
  buy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
    height: 38,
    borderRadius: radii.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  buyText: { fontSize: fontSize.small, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
