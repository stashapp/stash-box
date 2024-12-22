import { FC } from "react";
import type { CommentNotificationType } from "./types";

interface Props {
  notification: CommentNotificationType;
}

export const CommentNotification: FC<Props> = ({ notification }) => {
  return (
    <div>{ notification.data.comment.comment }</div>
  );
}
