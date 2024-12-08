import React from "react";
import { NotificationsQuery } from "src/graphql";
import SceneCard from "src/components/sceneCard";
import EditCard from "src/components/editCard";

type NotificationType =
  NotificationsQuery["queryNotifications"]["notifications"][number];

interface Props {
  notification: NotificationType;
}

const headers = {
  FavoritePerformerScene: "New scene involving a favorite performer",
  FavoriteStudioScene: "New scene from a favorite studio",
  FavoritePerformerEdit: "New edit involving a favorite performer",
  FavoriteStudioEdit: "New edit involving a favorite studio",
  DownvoteOwnEdit: "Your edit was downvoted",
  FailedOwnEdit: "Your edit failed",
  UpdatedEdit: "An edit you voted on was updated",
  CommentOwnEdit: "A user commented on your edit",
  CommentCommentedEdit: "A user commented on an edit you've commented on",
};

const renderNotificationBody = (notification: NotificationType) => {
  switch (notification.data.__typename) {
    case "FavoritePerformerScene":
    case "FavoriteStudioScene":
      return (
        <>
          <h2>{headers[notification.data.__typename]}</h2>
          <SceneCard scene={notification.data.scene} />
        </>
      );
    case "FavoritePerformerEdit":
    case "FavoriteStudioEdit":
    case "DownvoteOwnEdit":
    case "FailedOwnEdit":
    case "UpdatedEdit":
      return <EditCard edit={notification.data.edit} />;
    case "CommentOwnEdit":
    case "CommentCommentedEdit":
    case "CommentVotedEdit":
      return "comment";
  }
};

export const Notification: React.FC<Props> = ({ notification }) => {
  return (
    <div className="notification">{renderNotificationBody(notification)}</div>
  );
};
