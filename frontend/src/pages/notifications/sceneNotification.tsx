import { FC } from "react";
import SceneCard from "src/components/sceneCard";
import type { SceneNotificationType } from "./types";

interface Props {
  notification: SceneNotificationType;
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


export const SceneNotification: FC<Props> = ({ notification }) => {
    return (
      <>
        <h4>{headers[notification.data.__typename]}</h4>
        <SceneCard scene={notification.data.scene} />
      </>
    );
}
