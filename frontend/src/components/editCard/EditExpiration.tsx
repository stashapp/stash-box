import React from "react";
import { addSeconds, formatDistance } from "date-fns";

import { Tooltip } from "src/components/fragments";
import { useConfig, OperationEnum } from "src/graphql";
import { Edits_queryEdits_edits as Edit } from "src/graphql/definitions/Edits";

interface Props {
  edit: Edit;
}

const TooltipMessage: React.FC<{ pass: boolean; time: Date }> = ({
  pass,
  time,
}) => (
  <span>
    If no other votes are cast the edit will{" "}
    <b className={pass ? "text-success" : "text-danger"}>
      {pass ? "pass" : "fail"}
    </b>{" "}
    at {time.toLocaleString()}
  </span>
);

const ExpirationNotification: React.FC<Props> = ({ edit }) => {
  const { data } = useConfig();
  const config = data?.getConfig;

  if (!config) return <></>;

  const created = new Date(edit.created);
  const expirationTime = addSeconds(created, data.getConfig.voting_period);
  const expirationDistance = formatDistance(expirationTime, created);

  const threshold =
    edit.operation === OperationEnum.MERGE ||
    edit.operation === OperationEnum.DESTROY
      ? 1
      : 0;
  const pass = edit.vote_count >= threshold;

  return (
    <div>
      <Tooltip
        delay={0}
        text={<TooltipMessage pass={pass} time={expirationTime} />}
      >
        <span>
          Voting closes in{" "}
          <b>
            <u>{expirationDistance}</u>
          </b>
        </span>
      </Tooltip>
    </div>
  );
};

export default ExpirationNotification;
