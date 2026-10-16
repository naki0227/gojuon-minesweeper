import Constants, { ExecutionEnvironment } from "expo-constants";

type Notifications = typeof import("expo-notifications");

// A local notification every morning when the new 今日の一問 goes online
// (7:05 Japan time, in whatever time zone the device is in). Nothing is
// sent from a server.
function loadNotifications(): Notifications | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-notifications") as Notifications;
  } catch {
    return null;
  }
}

const notifications = loadNotifications();
const ID = "daily-morning";

export const remindersSupported = notifications !== null;

notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// 22:05 UTC is 7:05 in Japan (taken for today, so daylight saving time
// where the device is counts as it is now).
function localTime(): { hour: number; minute: number } {
  const at = new Date();
  at.setUTCHours(22, 5, 0, 0);
  return { hour: at.getHours(), minute: at.getMinutes() };
}

// Turns the reminder on (asking for permission if needed) or off.
// Returns whether it is on afterwards.
export async function setMorningReminder(on: boolean): Promise<boolean> {
  if (!notifications) return false;
  await notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
  if (!on) return false;
  const current = await notifications.getPermissionsAsync();
  const granted = current.granted
    ? current
    : await notifications.requestPermissionsAsync();
  if (!granted.granted) return false;
  await notifications.scheduleNotificationAsync({
    identifier: ID,
    content: {
      title: "今日の一問",
      body: "新しい問題が出たよ。盤面の数字から答えを推理しよう！",
    },
    trigger: {
      type: notifications.SchedulableTriggerInputTypes.DAILY,
      ...localTime(),
    },
  });
  return true;
}
