import { FC } from "react";
import { Link } from "react-router-dom";
import { sortBy } from "lodash-es";

import { VoteTypeEnum, EditFragment } from "src/graphql";
import { userHref, formatDateTime } from "src/utils";
import { VoteTypes } from "src/constants/enums";
import { Tooltip } from "src/components/fragments";

const CLASSNAME = "EditVotes";

interface VotesProps {
  edit: EditFragment;
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
        .map(
          (v) =>
            v.user && (
              <div key={`${edit.id}${v.user.id}`}>
                <Tooltip text={formatDateTime(v.date)}>
                  <Link to={userHref(v.user)}>{v.user.name}</Link>
                </Tooltip>
                <span className="mx-2">&bull;</span>
                {VoteTypes[v.vote]}
              </div>
            ),
        )}
    </div>
  </>
);

export default Votes;
