import type { FC } from "react";
import type { CommentNotificationType } from "./types";
import EditComment from "src/components/editCard/EditComment";

interface Props {
  notification: CommentNotificationType;
}

export const CommentNotification: FC<Props> = ({ notification }) => (
  <EditComment {...notification.data.comment} />
);
