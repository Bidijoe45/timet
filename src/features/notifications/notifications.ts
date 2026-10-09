import * as Notifications from 'expo-notifications';

// Show a banner + play sound even if the app is foregrounded when the timer ends.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let permissionAsked = false;

/** Ensure we have permission to post notifications; returns true if granted. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain && permissionAsked) return false;
  permissionAsked = true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * Schedule the "session complete" notification `remainingMs` from now.
 * Returns the notification id (or null if not scheduled).
 */
export async function scheduleCompletion(remainingMs: number, tagName?: string): Promise<string | null> {
  const seconds = Math.ceil(remainingMs / 1000);
  if (seconds <= 0) return null;
  const granted = await ensurePermission();
  if (!granted) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Focus complete',
      body: tagName ? `Your ${tagName} session is done. Nice work.` : 'Your session is done. Nice work.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

/** Cancel a previously scheduled completion notification. */
export async function cancelScheduled(id: string | null): Promise<void> {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
