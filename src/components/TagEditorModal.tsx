import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Tag } from '@/db/types';
import { TAG_COLORS, TAG_ICONS } from '@/features/tags/options';
import { useTagStore } from '@/features/tags/tagStore';
import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

interface TagEditorModalProps {
  visible: boolean;
  onClose: () => void;
}

type Mode = { kind: 'list' } | { kind: 'form'; editing: Tag | null };

export function TagEditorModal({ visible, onClose }: TagEditorModalProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { tags, addTag, editTag, removeTag } = useTagStore();

  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(TAG_COLORS[0]);
  const [icon, setIcon] = useState<string>(TAG_ICONS[0]);

  const openNew = () => {
    setName('');
    setColor(TAG_COLORS[0]);
    setIcon(TAG_ICONS[0]);
    setMode({ kind: 'form', editing: null });
  };

  const openEdit = (tag: Tag) => {
    setName(tag.name);
    setColor(tag.color);
    setIcon(tag.icon);
    setMode({ kind: 'form', editing: tag });
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const patch = { name: trimmed, color, icon };
    if (mode.kind === 'form' && mode.editing) {
      await editTag(mode.editing.id, patch);
    } else {
      await addTag(patch);
    }
    setMode({ kind: 'list' });
  };

  const confirmDelete = async (tag: Tag) => {
    await removeTag(tag.id);
    setMode({ kind: 'list' });
  };

  const close = () => {
    setMode({ kind: 'list' });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.bg, paddingBottom: insets.bottom + spacing.lg },
          ]}>
          <View style={styles.handleRow}>
            <Text style={[styles.title, { color: colors.fg }]}>
              {mode.kind === 'form' ? (mode.editing ? 'Edit tag' : 'New tag') : 'Tags'}
            </Text>
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>

          {mode.kind === 'list' ? (
            <ScrollView contentContainerStyle={styles.listContent}>
              {tags.map((tag) => (
                <View key={tag.id} style={[styles.tagRow, { borderColor: colors.line }]}>
                  <View style={[styles.swatch, { backgroundColor: tag.color }]}>
                    <Ionicons
                      name={tag.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color="#ffffff"
                    />
                  </View>
                  <Text style={[styles.tagName, { color: colors.fg }]}>{tag.name}</Text>
                  <Pressable
                    onPress={() => openEdit(tag)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${tag.name}`}
                    hitSlop={8}>
                    <Ionicons name="pencil" size={20} color={colors.muted} />
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(tag)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${tag.name}`}
                    hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={openNew}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.newBtn,
                  { borderColor: colors.accent, opacity: pressed ? 0.8 : 1 },
                ]}>
                <Ionicons name="add" size={20} color={colors.accent} />
                <Text style={[styles.newText, { color: colors.accent }]}>New tag</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.formContent}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Tag name"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  { color: colors.fg, backgroundColor: colors.surface, borderColor: colors.line },
                ]}
                maxLength={24}
                autoFocus
              />

              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Color</Text>
              <View style={styles.swatchGrid}>
                {TAG_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    accessibilityRole="button"
                    accessibilityLabel={`Color ${c}`}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c, borderColor: color === c ? colors.fg : 'transparent' },
                    ]}
                  />
                ))}
              </View>

              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Icon</Text>
              <View style={styles.swatchGrid}>
                {TAG_ICONS.map((ic) => {
                  const active = ic === icon;
                  return (
                    <Pressable
                      key={ic}
                      onPress={() => setIcon(ic)}
                      accessibilityRole="button"
                      accessibilityLabel={`Icon ${ic}`}
                      style={[
                        styles.iconChoice,
                        {
                          backgroundColor: active ? color : colors.surface,
                          borderColor: active ? color : colors.line,
                        },
                      ]}>
                      <Ionicons
                        name={ic as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={active ? '#ffffff' : colors.fg}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={save}
                disabled={!name.trim()}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.accent, opacity: !name.trim() ? 0.4 : pressed ? 0.85 : 1 },
                ]}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>

              {mode.kind === 'form' && mode.editing ? (
                <Pressable
                  onPress={() => mode.editing && confirmDelete(mode.editing)}
                  accessibilityRole="button"
                  style={styles.deleteLink}>
                  <Text style={[styles.deleteText, { color: colors.danger }]}>Delete tag</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          )}
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
    maxHeight: '85%',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSize.title, fontWeight: '700' },
  listContent: { gap: spacing.sm, paddingBottom: spacing.md },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagName: { flex: 1, fontSize: fontSize.body, fontWeight: '600' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: spacing.xs,
  },
  newText: { fontSize: fontSize.body, fontWeight: '600' },
  formContent: { gap: spacing.md, paddingBottom: spacing.xl },
  input: {
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.body,
  },
  sectionLabel: {
    fontSize: fontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: spacing.sm,
  },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  colorDot: { width: 40, height: 40, borderRadius: radii.pill, borderWidth: 3 },
  iconChoice: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  saveText: { color: '#ffffff', fontSize: fontSize.body, fontWeight: '700' },
  deleteLink: { alignItems: 'center', paddingVertical: spacing.md },
  deleteText: { fontSize: fontSize.body, fontWeight: '600' },
});
