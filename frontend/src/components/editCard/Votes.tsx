import React from "react";
import { Link } from "react-router-dom";

import { Edits_queryEdits_edits as Edit } from "src/graphql/definitions/Edits";
import { VoteTypeEnum } from "src/graphql";
import { userHref } from "src/utils/route";
import { VoteTypes } from "src/constants/enums";

const CLASSNAME = "EditVotes";

interface VotesProps {
  edit: Edit;
}

const Votes: React.FC<VotesProps> = ({ edit }) => (
  <>
    <div className={CLASSNAME}>
      <h5>Votes:</h5>
      <div>
        <b className="mr-2">Vote Tally:</b>
        <b>{edit.votes.filter((v) => v.vote === VoteTypeEnum.REJECT).length}</b>
        <span className="mx-1">no &mdash;</span>
        <b>{edit.votes.filter((v) => v.vote === VoteTypeEnum.ACCEPT).length}</b>
        <span className="ml-1">yes</span>
      </div>
      {edit.votes.map((v) => (
        <div>
          <Link to={userHref(v.user)}>{v.user.name}</Link>
          <span className="mx-2">&bull;</span>
          {VoteTypes[v.vote]}
        </div>
      ))}
    </div>
  </>
);

export default Votes;
