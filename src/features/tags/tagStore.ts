import { create } from 'zustand';

import { initDb } from '@/db/index';
import { getSetting, setSetting } from '@/db/settings';
import { deleteTag, insertTag, listTags, updateTag } from '@/db/tags';
import type { NewTag, Tag } from '@/db/types';

const SELECTED_KEY = 'selectedTagId';

interface TagState {
  tags: Tag[];
  selectedTagId: string | null;
  ready: boolean;
  bootstrap: () => Promise<void>;
  selectTag: (id: string) => void;
  addTag: (tag: NewTag) => Promise<void>;
  editTag: (id: string, patch: NewTag) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  selectedTag: () => Tag | null;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  selectedTagId: null,
  ready: false,

  bootstrap: async () => {
    await initDb();
    const tags = await listTags();
    const saved = await getSetting(SELECTED_KEY);
    const selectedTagId =
      saved && tags.some((t) => t.id === saved) ? saved : (tags[0]?.id ?? null);
    set({ tags, selectedTagId, ready: true });
  },

  selectTag: (id) => {
    set({ selectedTagId: id });
    setSetting(SELECTED_KEY, id).catch(() => {});
  },

  addTag: async (tag) => {
    const created = await insertTag(tag);
    set((s) => ({
      tags: [...s.tags, created],
      selectedTagId: s.selectedTagId ?? created.id,
    }));
  },

  editTag: async (id, patch) => {
    await updateTag(id, patch);
    set((s) => ({
      tags: s.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  },

  removeTag: async (id) => {
    await deleteTag(id);
    set((s) => {
      const tags = s.tags.filter((t) => t.id !== id);
      const selectedTagId = s.selectedTagId === id ? (tags[0]?.id ?? null) : s.selectedTagId;
      if (selectedTagId && selectedTagId !== s.selectedTagId) {
        setSetting(SELECTED_KEY, selectedTagId).catch(() => {});
      }
      return { tags, selectedTagId };
    });
  },

  selectedTag: () => {
    const { tags, selectedTagId } = get();
    return tags.find((t) => t.id === selectedTagId) ?? null;
  },
}));
