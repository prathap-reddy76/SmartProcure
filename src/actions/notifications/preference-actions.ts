"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface UserNotificationPreferences {
  procurement: boolean;
  orders: boolean;
  delivery: boolean;
  system: boolean;
  toasts: boolean;
  sound: boolean;
}

const DEFAULT_PREFERENCES: UserNotificationPreferences = {
  procurement: true,
  orders: true,
  delivery: true,
  system: true,
  toasts: true,
  sound: false,
};

/**
 * Retrieves the authenticated user's notification preferences.
 * Scoped strictly to session.user.id.
 */
export async function getUserNotificationPreferences(): Promise<{
  success: boolean;
  preferences: UserNotificationPreferences;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        preferences: DEFAULT_PREFERENCES,
        error: "Unauthorized",
      };
    }

    const record = await prisma.userNotificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    if (!record) {
      return {
        success: true,
        preferences: DEFAULT_PREFERENCES,
      };
    }

    return {
      success: true,
      preferences: {
        procurement: record.procurement,
        orders: record.orders,
        delivery: record.delivery,
        system: record.system,
        toasts: record.toasts,
        sound: record.sound,
      },
    };
  } catch (error) {
    console.error("Error retrieving notification preferences:", error);
    return {
      success: false,
      preferences: DEFAULT_PREFERENCES,
      error: "Failed to load preferences",
    };
  }
}

/**
 * Updates notification preferences for the authenticated user.
 * Scoped strictly to session.user.id.
 */
export async function updateUserNotificationPreferences(
  updates: Partial<UserNotificationPreferences>
): Promise<{
  success: boolean;
  preferences?: UserNotificationPreferences;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    const upserted = await prisma.userNotificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        procurement: updates.procurement ?? DEFAULT_PREFERENCES.procurement,
        orders: updates.orders ?? DEFAULT_PREFERENCES.orders,
        delivery: updates.delivery ?? DEFAULT_PREFERENCES.delivery,
        system: updates.system ?? DEFAULT_PREFERENCES.system,
        toasts: updates.toasts ?? DEFAULT_PREFERENCES.toasts,
        sound: updates.sound ?? DEFAULT_PREFERENCES.sound,
      },
      update: {
        ...(updates.procurement !== undefined && { procurement: updates.procurement }),
        ...(updates.orders !== undefined && { orders: updates.orders }),
        ...(updates.delivery !== undefined && { delivery: updates.delivery }),
        ...(updates.system !== undefined && { system: updates.system }),
        ...(updates.toasts !== undefined && { toasts: updates.toasts }),
        ...(updates.sound !== undefined && { sound: updates.sound }),
      },
    });

    revalidatePath("/notifications");
    revalidatePath("/settings/notifications");

    return {
      success: true,
      preferences: {
        procurement: upserted.procurement,
        orders: upserted.orders,
        delivery: upserted.delivery,
        system: upserted.system,
        toasts: upserted.toasts,
        sound: upserted.sound,
      },
    };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error: "Failed to save preferences" };
  }
}
