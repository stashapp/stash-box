import React from "react";
import { NotificationType, isSceneNotification, isEditNotification, isCommentNotification } from "./types";
import { CommentNotification } from "./CommentNotification";
import { SceneNotification } from "./sceneNotification";
import { EditNotification } from "./EditNotification";

interface Props {
  notification: NotificationType;
}

const renderNotificationBody = (notification: NotificationType) => {
  if (isCommentNotification(notification))
    return <CommentNotification notification={notification} />;
  if (isEditNotification(notification))
    return <EditNotification notification={notification} />;
  if (isSceneNotification(notification))
    return <SceneNotification notification={notification} />;
};

export const Notification: React.FC<Props> = ({ notification }) => {
  return (
    <div className="notification">{renderNotificationBody(notification)}</div>
  );
};
