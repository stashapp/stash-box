import { FC } from "react";
import { formatDistance } from "date-fns";

import { Tooltip } from "src/components/fragments";
import {
  useConfig,
  VoteStatusEnum,
  EditFragment,
  VoteTypeEnum,
} from "src/graphql";

interface Props {
  edit: EditFragment;
}

const TooltipMessage: FC<{ pass: boolean; time: Date }> = ({ pass, time }) => (
  <span>
    If no other votes are cast the edit will{" "}
    <b className={pass ? "text-success" : "text-danger"}>
      {pass ? "pass" : "fail"}
    </b>{" "}
    at {time.toLocaleString()}
  </span>
);

const ExpirationNotification: FC<Props> = ({ edit }) => {
  const { data } = useConfig();
  const config = data?.getConfig;

  if (
    !config ||
    !config.vote_cron_interval ||
    edit.status !== VoteStatusEnum.PENDING ||
    !edit.expires
  )
    return <></>;

  const voteTotal =
    edit.votes.filter((v) => v.vote === VoteTypeEnum.ACCEPT).length -
    edit.votes.filter((v) => v.vote === VoteTypeEnum.REJECT).length;
  // Pending edits that have reached the voting threshold have shorter voting periods.
  // This will happen for destructive edits, or when votes are not unanimous.
  const shortVotingPeriod =
    config.vote_application_threshold > 0 &&
    voteTotal >= config.vote_application_threshold;

  const expirationTime = new Date(edit.expires);
  const expirationDistance =
    expirationTime > new Date()
      ? formatDistance(expirationTime, new Date())
      : " a moment";

  const threshold = edit.destructive ? 1 : 0;
  const pass = shortVotingPeriod || voteTotal >= threshold;

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
