import React, { useContext, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import AuthContext from "src/AuthContext";
import { VoteStatusEnum, VoteTypeEnum, useVote } from "src/graphql";
import { Icon } from "src/components/fragments";
import { Edits_queryEdits_edits as Edit } from "src/graphql/definitions/Edits";
import { canVote } from "src/utils";

const CLASSNAME = "VoteBar";
const CLASSNAME_VOTED = `${CLASSNAME}-voted`;
const CLASSNAME_SAVE = `${CLASSNAME}-save`;

interface Props {
  edit: Edit;
}

const VoteBar: React.FC<Props> = ({ edit }) => {
  const auth = useContext(AuthContext);
  const userVote = (edit.votes ?? []).find(
    (v) => v.user?.id && v.user.id === auth.user?.id
  );
  const [vote, setVote] = useState<VoteTypeEnum | null>(userVote?.vote ?? null);
  const [submitVote, { loading: savingVote }] = useVote();

  if (
    edit.status !== VoteStatusEnum.PENDING ||
    !canVote(auth.user) ||
    auth.user?.id === edit.user?.id
  )
    return <></>;

  const handleSave = () => {
    if (!vote) return;

    submitVote({
      variables: {
        input: {
          id: edit.id,
          vote,
        },
      },
    });
  };

  return (
    <Form.Row className={CLASSNAME}>
      <div className={CLASSNAME_SAVE}>
        <h6>
          <span className="mr-2">Current Vote:</span>
          <span>{`${edit.vote_count > 0 ? "+" : ""}${
            edit.vote_count === 0 ? "-" : edit.vote_count
          }`}</span>
        </h6>
        {vote &&
          vote !== userVote?.vote &&
          (userVote || vote !== VoteTypeEnum.ABSTAIN) && (
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={savingVote}
            >
              <span className="mr-2">Save</span>
              <Icon icon={faCheck} color="green" />
            </Button>
          )}
      </div>
      <Form.Group
        controlId="vote-yes"
        className={cx({
          [CLASSNAME_VOTED]: userVote?.vote === VoteTypeEnum.ACCEPT,
          "bg-success": vote === VoteTypeEnum.ACCEPT,
        })}
        onChange={() => setVote(VoteTypeEnum.ACCEPT)}
      >
        <Form.Control
          type="radio"
          name={`${edit.id}-vote`}
          defaultChecked={userVote?.vote === VoteTypeEnum.ACCEPT}
        />
        <Form.Label>Yes</Form.Label>
      </Form.Group>
      <Form.Group
        controlId="vote-no"
        className={cx({
          [CLASSNAME_VOTED]: userVote?.vote === VoteTypeEnum.REJECT,
          "bg-danger": vote === VoteTypeEnum.REJECT,
        })}
        onChange={() => setVote(VoteTypeEnum.REJECT)}
      >
        <Form.Control
          type="radio"
          name={`${edit.id}-vote`}
          defaultChecked={userVote?.vote === VoteTypeEnum.REJECT}
        />
        <Form.Label>No</Form.Label>
      </Form.Group>
      <Form.Group
        controlId="vote-abstain"
        className={cx({
          [CLASSNAME_VOTED]: userVote?.vote === VoteTypeEnum.ABSTAIN,
          "bg-warning": vote === VoteTypeEnum.ABSTAIN,
        })}
        onChange={() => setVote(VoteTypeEnum.ABSTAIN)}
      >
        <Form.Control
          type="radio"
          name={`${edit.id}-vote`}
          defaultChecked={userVote?.vote === VoteTypeEnum.ABSTAIN}
        />
        <Form.Label>Abstain</Form.Label>
      </Form.Group>
    </Form.Row>
  );
};

export default VoteBar;
