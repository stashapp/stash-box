import {
  faCircle,
  faEnvelope,
  faEnvelopeOpen,
} from "@fortawesome/free-solid-svg-icons";
import type React from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import {
  NotificationEnum,
  NotificationLevel,
  useMarkNotificationRead,
} from "src/graphql";
import { editHref } from "src/utils";
import { CommentNotification } from "./CommentNotification";
import { EditNotification } from "./EditNotification";
import { FingerprintMovedNotification } from "./FingerprintMovedNotification";
import { SceneNotification } from "./sceneNotification";
import {
  isCommentNotification,
  isEditNotification,
  isFingerprintMovedNotification,
  isSceneNotification,
  type NotificationType,
} from "./types";

interface Props {
  notification: NotificationType;
}

const createMarkNotificationReadInput = (notification: NotificationType) => {
  switch (notification.data.__typename) {
    case "CommentOwnEdit":
      return {
        type: NotificationEnum.COMMENT_OWN_EDIT,
        id: notification.data.comment.id,
      };
    case "CommentCommentedEdit":
      return {
        type: NotificationEnum.COMMENT_COMMENTED_EDIT,
        id: notification.data.comment.id,
      };
    case "CommentVotedEdit":
      return {
        type: NotificationEnum.COMMENT_VOTED_EDIT,
        id: notification.data.comment.id,
      };
    case "DownvoteOwnEdit":
      return {
        type: NotificationEnum.DOWNVOTE_OWN_EDIT,
        id: notification.data.edit.id,
      };
    case "FailedOwnEdit":
      return {
        type: NotificationEnum.FAILED_OWN_EDIT,
        id: notification.data.edit.id,
      };
    case "FavoritePerformerEdit":
      return {
        type: NotificationEnum.FAVORITE_PERFORMER_EDIT,
        id: notification.data.edit.id,
      };
    case "FavoriteStudioEdit":
      return {
        type: NotificationEnum.FAVORITE_STUDIO_EDIT,
        id: notification.data.edit.id,
      };
    case "FingerprintedSceneEdit":
      return {
        type: NotificationEnum.FINGERPRINTED_SCENE_EDIT,
        id: notification.data.edit.id,
      };
    case "UpdatedEdit":
      return {
        type: NotificationEnum.UPDATED_EDIT,
        id: notification.data.edit.id,
      };
    case "FavoritePerformerScene":
      return {
        type: NotificationEnum.FAVORITE_PERFORMER_SCENE,
        id: notification.data.scene.id,
      };
    case "FavoriteStudioScene":
      return {
        type: NotificationEnum.FAVORITE_STUDIO_SCENE,
        id: notification.data.scene.id,
      };
    case "FingerprintMovedScene":
      return {
        type: NotificationEnum.FINGERPRINT_MOVED,
        id: notification.data.source_scene.id,
      };
  }
};

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
  if (isFingerprintMovedNotification(notification))
    return <FingerprintMovedNotification notification={notification} />;
};

const NotificationHeader = ({
  notification,
}: {
  notification: NotificationType;
}) => {
  const [markRead, { loading }] = useMarkNotificationRead({
    notification: createMarkNotificationReadInput(notification),
  });

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
    if (isFingerprintMovedNotification(notification)) {
      return `Your PHASH fingerprint (${notification.data.fingerprint_hash}) was moved to another scene.`;
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

  const isUrgent = notification.level === NotificationLevel.URGENT;
  const getUrgencyVariant = () => {
    if (isUrgent) return "danger";
    if (!notification.read) return "primary";
    return "white";
  };

  return (
    <h5 className="d-flex gap-2 align-items-center">
      <Icon
        icon={faCircle}
        variant={getUrgencyVariant()}
        title={isUrgent ? "Urgent" : "Normal"}
      />
      <div className="Notification-read-state">
        {notification.read && <Icon icon={faEnvelopeOpen} />}
        {!notification.read && (
          <Button
            variant="link"
            onClick={() => markRead()}
            title="Mark notification as read"
            disabled={loading}
          >
            <Icon icon={faEnvelope} variant={"warning"} />
            <Icon icon={faEnvelopeOpen} />
          </Button>
        )}
      </div>
      {headerText()}
    </h5>
  );
};

export const Notification: React.FC<Props> = ({ notification }) => {
  return (
    <div className="Notification">
      <NotificationHeader notification={notification} />
      <NotificationBody notification={notification} />
    </div>
  );
};
