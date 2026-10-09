import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TreeThumb } from '@/components/forest/TreeThumb';
import { TREE_LABELS, type TreeName } from '@/features/forest/forestConfig';
import { useForestStore } from '@/features/forest/forestStore';
import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

/** Lets the player choose which unlocked tree this session will plant. */
export function TreeSelector() {
  const { colors } = useAppTheme();
  const unlockedTrees = useForestStore((s) => s.unlockedTrees);
  const selectedTree = useForestStore((s) => s.selectedTree);
  const selectTree = useForestStore((s) => s.selectTree);

  const choose = (name: TreeName) => {
    if (name !== selectedTree && Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    selectTree(name);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>Planting</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {unlockedTrees.map((name) => {
          const active = name === selectedTree;
          return (
            <Pressable
              key={name}
              onPress={() => choose(name)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.card,
                {
                  backgroundColor: active ? colors.accentSoft : colors.surface,
                  borderColor: active ? colors.accent : colors.line,
                },
              ]}>
              <TreeThumb name={name} height={46} />
              <Text style={[styles.name, { color: active ? colors.accent : colors.muted }]}>
                {TREE_LABELS[name]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: {
    fontSize: fontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: spacing.xl,
  },
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  card: {
    width: 72,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 2,
  },
  name: { fontSize: fontSize.caption, fontWeight: '600' },
});
