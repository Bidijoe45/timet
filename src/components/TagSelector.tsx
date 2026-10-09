import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { Tag } from '@/db/types';
import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagId: string | null;
  onSelect: (id: string) => void;
  onManage: () => void;
}

export function TagSelector({ tags, selectedTagId, onSelect, onManage }: TagSelectorProps) {
  const { colors } = useAppTheme();

  const select = (id: string) => {
    if (id !== selectedTagId && Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    onSelect(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}>
      {tags.map((tag) => {
        const active = tag.id === selectedTagId;
        return (
          <Pressable
            key={tag.id}
            onPress={() => select(tag.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? tag.color : colors.surface,
                borderColor: active ? tag.color : colors.line,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Ionicons
              name={tag.icon as keyof typeof Ionicons.glyphMap}
              size={16}
              color={active ? '#ffffff' : tag.color}
            />
            <Text style={[styles.chipText, { color: active ? '#ffffff' : colors.fg }]}>
              {tag.name}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={onManage}
        accessibilityRole="button"
        accessibilityLabel="Manage tags"
        style={({ pressed }) => [
          styles.manage,
          { borderColor: colors.line, opacity: pressed ? 0.7 : 1 },
        ]}>
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  chipText: { fontSize: fontSize.small, fontWeight: '600' },
  manage: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
