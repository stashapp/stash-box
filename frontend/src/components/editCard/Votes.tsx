import { sortBy } from "lodash-es";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { Tooltip } from "src/components/fragments";
import { VoteTypes } from "src/constants/enums";
import { VoteTypeEnum } from "src/graphql";
import { formatDateTime, userHref } from "src/utils";
import type { EditCardEdit } from "./types";

const CLASSNAME = "EditVotes";

interface VotesProps {
  edit: EditCardEdit;
}

const Votes: FC<VotesProps> = ({ edit }) => (
  <>
    <div className={CLASSNAME}>
      <h5>Votes:</h5>
      <div>
        <b className="me-2">Vote Tally:</b>
        <b>{edit.votes.filter((v) => v.vote === VoteTypeEnum.ACCEPT).length}</b>
        <span className="mx-1">yes &mdash;</span>
        <b>{edit.votes.filter((v) => v.vote === VoteTypeEnum.REJECT).length}</b>
        <span className="ms-1">no</span>
      </div>
      {sortBy(edit.votes, (v) => v.date)
        .filter((v) => v.vote !== VoteTypeEnum.ABSTAIN)
        .map((v) => (
          <div key={`${edit.id}${v.user?.id ?? v.date}`}>
            <Tooltip text={formatDateTime(v.date)}>
              {v.user ? (
                <Link to={userHref(v.user)}>{v.user.name}</Link>
              ) : (
                <span className="text-muted">[deleted user]</span>
              )}
            </Tooltip>
            <span className="mx-2">&bull;</span>
            {VoteTypes[v.vote]}
          </div>
        ))}
    </div>
  </>
);

export default Votes;
