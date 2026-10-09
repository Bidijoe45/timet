import { genId, type NewTag, type Tag } from '@/db/types';

// In-memory tag store for the web preview (not persisted across reloads).
let tags: Tag[] = [
  { id: 'seed-work', name: 'Work', color: '#0ea5e9', icon: 'briefcase', createdAt: Date.now() },
  { id: 'seed-study', name: 'Study', color: '#8b5cf6', icon: 'book', createdAt: Date.now() },
  { id: 'seed-exercise', name: 'Exercise', color: '#22c55e', icon: 'barbell', createdAt: Date.now() },
  { id: 'seed-reading', name: 'Reading', color: '#f59e0b', icon: 'library', createdAt: Date.now() },
];

export async function listTags(): Promise<Tag[]> {
  return [...tags];
}

export async function insertTag(tag: NewTag): Promise<Tag> {
  const full: Tag = { id: genId(), createdAt: Date.now(), ...tag };
  tags = [...tags, full];
  return full;
}

export async function updateTag(id: string, patch: NewTag): Promise<void> {
  tags = tags.map((t) => (t.id === id ? { ...t, ...patch } : t));
}

export async function deleteTag(id: string): Promise<void> {
  tags = tags.filter((t) => t.id !== id);
}
