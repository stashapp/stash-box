import type { FC } from "react";
import EditCard from "src/components/editCard";
import type { EditNotificationType } from "./types";

interface Props {
  notification: EditNotificationType;
}

export const EditNotification: FC<Props> = ({ notification }) => {
  return (
    <EditCard
      edit={notification.data.edit}
      showVotes
      hideDiff
      showVoteBar={false}
    />
  );
};
