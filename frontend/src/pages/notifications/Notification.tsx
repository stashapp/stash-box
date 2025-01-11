import React from "react";
import { faEnvelope, faEnvelopeOpen } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "src/components/fragments";
import {
  NotificationType,
  isSceneNotification,
  isEditNotification,
  isCommentNotification,
} from "./types";
import { CommentNotification } from "./CommentNotification";
import { SceneNotification } from "./sceneNotification";
import { EditNotification } from "./EditNotification";
import { editHref } from "src/utils";
import { Link } from "react-router-dom";

interface Props {
  notification: NotificationType;
}

const NotificationBody = ({
  notification,
}: {
  notification: NotificationType;
}) => {
  if (isCommentNotification(notification))
    return <CommentNotification notification={notification} />;
  if (isEditNotification(notification))
    return <EditNotification notification={notification} />;
  if (isSceneNotification(notification))
    return <SceneNotification notification={notification} />;
};

const NotificationHeader = ({
  notification,
}: {
  notification: NotificationType;
}) => {
  const headerText = () => {
    if (isCommentNotification(notification)) {
      const editLink = (
        <Link
          to={editHref(notification.data.comment.edit)}
          className="text-decoration-underline fst-italic"
        >
          edit
        </Link>
      );
      if (notification.data.__typename === "CommentCommentedEdit")
        return (
          <span>
            <em>{notification.data.comment.user?.name}</em> commented on an{" "}
            {editLink}
            {" you've commented on."}
          </span>
        );
      if (notification.data.__typename === "CommentOwnEdit")
        return (
          <span>
            <em>{notification.data.comment.user?.name}</em> commented on your{" "}
            {editLink}.
          </span>
        );
      if (notification.data.__typename === "CommentVotedEdit")
        return (
          <span>
            <em>{notification.data.comment.user?.name}</em> commented on an{" "}
            {editLink}
            {" you've voted on."}
          </span>
        );
    }
    if (isEditNotification(notification)) {
      if (notification.data.__typename === "DownvoteOwnEdit")
        return `A user voted no on your edit.`;
      if (notification.data.__typename === "FailedOwnEdit")
        return `Your edit has failed.`;
      if (notification.data.__typename === "UpdatedEdit")
        return `An edit you've voted on was updated.`;
      if (notification.data.__typename === "FavoritePerformerEdit")
        return `An edit was created involving a favorited performer.`;
      if (notification.data.__typename === "FavoriteStudioEdit")
        return `An edit was created involving a favorited studio.`;
      if (notification.data.__typename === "FingerprintedSceneEdit")
        return `An edit was created for a scene you have submitted fingerprints for.`;
    }
    if (isSceneNotification(notification)) {
      if (notification.data.__typename === "FavoriteStudioScene")
        return (
          <span>
            A new scene from <em>{notification.data.scene.studio?.name}</em> was
            submitted.
          </span>
        );
      if (notification.data.__typename === "FavoritePerformerScene")
        return `A new scene involving a favorited performer was submitted.`;
    }
  };

  return (
    <h5>
      <Icon
        icon={notification.read ? faEnvelopeOpen : faEnvelope}
        variant={!notification.read ? "warning" : undefined}
        className="me-2"
      />
      {headerText()}
    </h5>
  );
};

export const Notification: React.FC<Props> = ({ notification }) => {
  return (
    <div className="notification">
      <NotificationHeader notification={notification} />
      <NotificationBody notification={notification} />
    </div>
  );
};
