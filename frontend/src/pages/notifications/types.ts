import { NotificationsQuery } from "src/graphql";

export type NotificationType =
  NotificationsQuery["queryNotifications"]["notifications"][number];

type CommentData = Extract<NotificationType["data"], { comment: unknown }>;
export type CommentNotificationType = NotificationType & { data: CommentData };
export const isCommentNotification = (
  notification: NotificationType,
): notification is CommentNotificationType =>
  (notification.data as CommentData).comment !== undefined;

type EditData = Extract<NotificationType["data"], { edit: unknown }>;
export type EditNotificationType = NotificationType & { data: EditData };
export const isEditNotification = (
  notification: NotificationType,
): notification is EditNotificationType =>
  (notification.data as EditData).edit !== undefined;

type SceneData = Extract<NotificationType["data"], { scene: unknown }>;
export type SceneNotificationType = NotificationType & { data: SceneData };
export const isSceneNotification = (
  notification: NotificationType,
): notification is SceneNotificationType =>
  (notification.data as SceneData).scene !== undefined;
