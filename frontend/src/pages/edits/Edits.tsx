import { FC } from "react";

import { VoteStatusEnum } from "src/graphql";
import { EditList } from "src/components/list";
import Title from "src/components/title";

const EditsComponent: FC = () => (
  <>
    <Title page="Edits" />
    <h3>Edits</h3>
    <EditList defaultVoteStatus={VoteStatusEnum.PENDING} />
  </>
);

export default EditsComponent;
