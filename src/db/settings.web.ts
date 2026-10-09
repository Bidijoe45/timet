// In-memory settings for the web preview (not persisted across reloads).
const store = new Map<string, string>();

export async function getSetting(key: string): Promise<string | null> {
  return store.get(key) ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  store.set(key, value);
}
