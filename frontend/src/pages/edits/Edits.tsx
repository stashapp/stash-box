import type { FC } from "react";
import { EditList } from "src/components/list";
import Title from "src/components/title";
import { UserVotedFilterEnum, VoteStatusEnum } from "src/graphql";

const EditsComponent: FC = () => (
  <>
    <Title page="Edits" />
    <h3>Edits</h3>
    <EditList
      defaultVoteStatus={VoteStatusEnum.PENDING}
      defaultVoted={UserVotedFilterEnum.NOT_VOTED}
      defaultBot="exclude"
      defaultUserSubmitted={true}
    />
  </>
);

export default EditsComponent;
