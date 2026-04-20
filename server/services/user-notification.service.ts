import type { InsertNotification, Notification } from "@shared/schema";
import { areEmailNotificationsEnabled } from "@shared/notification-preferences";
import logger from "../logger";
import { storage } from "../storage";
import { sendNotificationEmail } from "./email.service";

type CreateUserNotificationOptions = {
  sendEmail?: boolean;
};

export const createUserNotification = async (
  notification: InsertNotification,
  options: CreateUserNotificationOptions = {},
): Promise<Notification> => {
  const createdNotification = await storage.createNotification(notification);

  if (options.sendEmail === false) {
    return createdNotification;
  }

  void (async () => {
    const user = await storage.getUser(notification.userId);

    if (!user?.email || !user.fullName) {
      return;
    }

    if (!areEmailNotificationsEnabled(user.preferences)) {
      return;
    }

    await sendNotificationEmail(
      user.email,
      user.fullName,
      notification.title,
      notification.message,
    );
  })().catch((error) => {
    logger.error("[Notifications] Failed to send notification email:", error);
  });

  return createdNotification;
};
