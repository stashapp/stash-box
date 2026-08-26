import type { FC } from "react";
import { Tooltip } from "src/components/fragments";
import { useConfig, VoteStatusEnum } from "src/graphql";
import {
  formatDistance,
  formatInstant,
  isInstantInFuture,
  parseInstant,
} from "src/utils";
import type { Temporal } from "temporal-polyfill";

import type { EditCardEdit } from "./types";

interface Props {
  edit: EditCardEdit;
}

const TooltipMessage: FC<{
  pass: boolean;
  time: Temporal.Instant | undefined;
}> = ({ pass, time }) => (
  <span>
    If no other votes are cast the edit will{" "}
    <b className={pass ? "text-success" : "text-danger"}>
      {pass ? "pass" : "fail"}
    </b>{" "}
    at {time ? formatInstant(time) : ""}
  </span>
);

const ExpirationNotification: FC<Props> = ({ edit }) => {
  const { data } = useConfig();
  const config = data?.getConfig;

  if (
    !config?.vote_cron_interval ||
    edit.status !== VoteStatusEnum.PENDING ||
    !edit.expires ||
    edit.passing == null
  )
    return null;

  const expirationTime = parseInstant(edit.expires);
  const expirationDistance =
    expirationTime && isInstantInFuture(expirationTime)
      ? formatDistance(expirationTime)
      : "in a moment";

  return (
    <div>
      <Tooltip
        delay={0}
        text={<TooltipMessage pass={edit.passing} time={expirationTime} />}
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
