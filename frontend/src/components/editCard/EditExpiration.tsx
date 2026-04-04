import type { FC } from "react";
import { Temporal } from "temporal-polyfill";
import { formatDistance, parseInstant } from "src/utils";

import { Tooltip } from "src/components/fragments";
import { useConfig, VoteStatusEnum, type EditFragment } from "src/graphql";

interface Props {
  edit: EditFragment;
}

const TooltipMessage: FC<{ pass: boolean; time: Temporal.Instant | undefined}> = ({ pass, time }) => (
  <span>
    If no other votes are cast the edit will{" "}
    <b className={pass ? "text-success" : "text-danger"}>
      {pass ? "pass" : "fail"}
    </b>{" "}
    at {time?.toZonedDateTimeISO(Temporal.Now.timeZoneId()).toLocaleString() ?? ""}
  </span>
);

const ExpirationNotification: FC<Props> = ({ edit }) => {
  const { data } = useConfig();
  const config = data?.getConfig;

  if (
    !config?.vote_cron_interval ||
    edit.status !== VoteStatusEnum.PENDING ||
    !edit.expires
  )
    return null;

  // Pending edits that have reached the voting threshold have shorter voting periods.
  // This will happen for destructive edits, or when votes are not unanimous.
  const shortVotingPeriod =
    config.vote_application_threshold > 0 &&
    edit.vote_count >= config.vote_application_threshold;

  const expirationTime = parseInstant(edit.expires);
  const expirationDistance =
    expirationTime && Temporal.Instant.compare(expirationTime, Temporal.Now.instant()) > 0
      ? formatDistance(expirationTime)
      : "in a moment";

  const threshold = edit.destructive ? 1 : 0;
  const pass = shortVotingPeriod || edit.vote_count >= threshold;

  return (
    <div>
      <Tooltip
        delay={0}
        text={<TooltipMessage pass={pass} time={expirationTime} />}
      >
        <span>
          Voting closes{" "}
          <b>
            <u>{expirationDistance}</u>
          </b>
        </span>
      </Tooltip>
    </div>
  );
};

export default ExpirationNotification;
