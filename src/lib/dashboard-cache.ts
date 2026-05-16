import { revalidateTag } from "next/cache";

export const dashboardCacheTags = {
  user: (userId: string) => `user:${userId}`,
  sidebar: (userId: string) => `sidebar:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  messages: (userId: string) => `messages:${userId}`,
  savedCourses: (userId: string) => `saved-courses:${userId}`,
};

export function revalidateUserDashboard(userId: string) {
  revalidateTag(dashboardCacheTags.user(userId));
  revalidateTag(dashboardCacheTags.sidebar(userId));
}

export function revalidateUserSidebar(userId: string) {
  revalidateTag(dashboardCacheTags.sidebar(userId));
}

export function revalidateUserNotifications(userId: string) {
  revalidateTag(dashboardCacheTags.notifications(userId));
}

export function revalidateUserMessages(userId: string) {
  revalidateTag(dashboardCacheTags.messages(userId));
}

export function revalidateUserSavedCourses(userId: string) {
  revalidateTag(dashboardCacheTags.savedCourses(userId));
}
