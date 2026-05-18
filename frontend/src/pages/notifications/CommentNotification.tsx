import type { FC } from "react";
import EditComment from "src/components/editCard/EditComment";
import type { CommentNotificationType } from "./types";

interface Props {
  notification: CommentNotificationType;
}

export const CommentNotification: FC<Props> = ({ notification }) => (
  <EditComment {...notification.data.comment} />
);
