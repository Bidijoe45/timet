import { getDb, genId } from '@/db/index';
import type { NewTag, Tag } from '@/db/types';

interface TagRow {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: number;
}

const toTag = (r: TagRow): Tag => ({
  id: r.id,
  name: r.name,
  color: r.color,
  icon: r.icon,
  createdAt: r.created_at,
});

export async function listTags(): Promise<Tag[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TagRow>('SELECT * FROM tags ORDER BY created_at ASC');
  return rows.map(toTag);
}

export async function insertTag(tag: NewTag): Promise<Tag> {
  const db = await getDb();
  const full: Tag = { id: genId(), createdAt: Date.now(), ...tag };
  await db.runAsync(
    'INSERT INTO tags (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)',
    full.id,
    full.name,
    full.color,
    full.icon,
    full.createdAt,
  );
  return full;
}

export async function updateTag(id: string, patch: NewTag): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE tags SET name = ?, color = ?, icon = ? WHERE id = ?',
    patch.name,
    patch.color,
    patch.icon,
    id,
  );
}

/** Deletes a tag; existing sessions keep their history by detaching (tag_id → NULL). */
export async function deleteTag(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE sessions SET tag_id = NULL WHERE tag_id = ?', id);
  await db.runAsync('DELETE FROM tags WHERE id = ?', id);
}
