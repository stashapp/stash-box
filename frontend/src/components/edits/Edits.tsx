import React from "react";

import {
  VoteStatusEnum,
} from "src/definitions/globalTypes";

import EditList from "src/components/editList";

const EditsComponent: React.FC = () => {
  return (
    <>
      <h3>Edits</h3>
      <EditList defaultStatus={VoteStatusEnum.PENDING} />
    </>
  );
};

export default EditsComponent;
