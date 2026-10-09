// Web build: no expo-sqlite (its WASM worker needs headers Expo's web dev server
// doesn't provide). The web variants of tags/sessions/settings keep state in memory,
// so this just satisfies the shared API surface.
import { genId } from '@/db/types';

export async function initDb(): Promise<void> {
  // no-op on web
}

export { genId };
