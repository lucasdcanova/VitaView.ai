export type NotificationSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  examReminders: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  examReminders: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseUserPreferences = (preferences: unknown): Record<string, unknown> => {
  if (typeof preferences === "string") {
    try {
      const parsed = JSON.parse(preferences);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return isRecord(preferences) ? preferences : {};
};

export const getNotificationSettings = (preferences: unknown): NotificationSettings => {
  const parsedPreferences = parseUserPreferences(preferences);
  const storedSettings = isRecord(parsedPreferences.notifications)
    ? parsedPreferences.notifications
    : {};

  return {
    emailNotifications:
      typeof storedSettings.emailNotifications === "boolean"
        ? storedSettings.emailNotifications
        : DEFAULT_NOTIFICATION_SETTINGS.emailNotifications,
    pushNotifications:
      typeof storedSettings.pushNotifications === "boolean"
        ? storedSettings.pushNotifications
        : DEFAULT_NOTIFICATION_SETTINGS.pushNotifications,
    examReminders:
      typeof storedSettings.examReminders === "boolean"
        ? storedSettings.examReminders
        : DEFAULT_NOTIFICATION_SETTINGS.examReminders,
  };
};

export const mergeNotificationSettings = (
  preferences: unknown,
  updates: Partial<NotificationSettings>,
): Record<string, unknown> => {
  const parsedPreferences = parseUserPreferences(preferences);

  return {
    ...parsedPreferences,
    notifications: {
      ...getNotificationSettings(parsedPreferences),
      ...updates,
    },
  };
};

export const areEmailNotificationsEnabled = (preferences: unknown): boolean =>
  getNotificationSettings(preferences).emailNotifications;
