// The web has no morning reminder; reminder.native.ts schedules one.
export const remindersSupported = false;

export async function setMorningReminder(_on: boolean): Promise<boolean> {
  return false;
}
