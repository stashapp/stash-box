import { FC, useContext, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import AuthContext from "src/AuthContext";
import {
  VoteStatusEnum,
  VoteTypeEnum,
  useVote,
  EditFragment,
} from "src/graphql";
import { Icon } from "src/components/fragments";
import { canVote } from "src/utils";

const CLASSNAME = "VoteBar";
const CLASSNAME_BUTTON = `${CLASSNAME}-button`;
const CLASSNAME_VOTED = `${CLASSNAME}-voted`;
const CLASSNAME_SAVE = `${CLASSNAME}-save`;

interface Props {
  edit: EditFragment;
}

const VoteBar: FC<Props> = ({ edit }) => {
  const auth = useContext(AuthContext);
  const userVote = (edit.votes ?? []).find(
    (v) => v.user?.id && v.user.id === auth.user?.id
  );
  const [vote, setVote] = useState<VoteTypeEnum | null>(userVote?.vote ?? null);
  const [submitVote, { loading: savingVote }] = useVote();
  const voteTotal =
    edit.votes.filter((v) => v.vote === VoteTypeEnum.ACCEPT).length -
    edit.votes.filter((v) => v.vote === VoteTypeEnum.REJECT).length;

  if (edit.status !== VoteStatusEnum.PENDING) return <></>;

  const currentVote = (
    <h6>
      <span className="me-2">Current Vote:</span>
      <span>{`${voteTotal > 0 ? "+" : ""}${
        voteTotal === 0 ? "-" : voteTotal
      }`}</span>
    </h6>
  );

  // Only show vote total for edit owner and users without vote role
  if (!canVote(auth.user) || auth.user?.id === edit.user?.id)
    return <div>{currentVote}</div>;

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
    <div className={CLASSNAME}>
      <div className={CLASSNAME_SAVE}>
        {currentVote}
        {vote &&
          vote !== userVote?.vote &&
          (userVote || vote !== VoteTypeEnum.ABSTAIN) && (
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={savingVote}
            >
              <span className="me-2">Save</span>
              <Icon icon={faCheck} color="green" />
            </Button>
          )}
      </div>
      <Form.Group
        controlId={`${edit.id}-vote-yes`}
        className={cx(CLASSNAME_BUTTON, {
          [CLASSNAME_VOTED]: userVote?.vote === VoteTypeEnum.ACCEPT,
          "bg-success": vote === VoteTypeEnum.ACCEPT,
        })}
        onChange={() => setVote(VoteTypeEnum.ACCEPT)}
      >
        <Form.Label>
          <Form.Check
            type="radio"
            name={`${edit.id}-vote`}
            defaultChecked={userVote?.vote === VoteTypeEnum.ACCEPT}
          />
          <span>Yes</span>
        </Form.Label>
      </Form.Group>
      <Form.Group
        controlId={`${edit.id}-vote-no`}
        className={cx(CLASSNAME_BUTTON, {
          [CLASSNAME_VOTED]: userVote?.vote === VoteTypeEnum.REJECT,
          "bg-danger": vote === VoteTypeEnum.REJECT,
        })}
        onChange={() => setVote(VoteTypeEnum.REJECT)}
      >
        <Form.Label>
          <Form.Check
            type="radio"
            name={`${edit.id}-vote`}
            defaultChecked={userVote?.vote === VoteTypeEnum.REJECT}
          />
          <span>No</span>
        </Form.Label>
      </Form.Group>
      <Form.Group
        controlId={`${edit.id}-vote-abstain`}
        className={cx(CLASSNAME_BUTTON, {
          [CLASSNAME_VOTED]: userVote?.vote === VoteTypeEnum.ABSTAIN,
          "bg-warning": vote === VoteTypeEnum.ABSTAIN,
        })}
        onChange={() => setVote(VoteTypeEnum.ABSTAIN)}
      >
        <Form.Label>
          <Form.Check
            type="radio"
            name={`${edit.id}-vote`}
            defaultChecked={userVote?.vote === VoteTypeEnum.ABSTAIN}
          />
          <span>Abstain</span>
        </Form.Label>
      </Form.Group>
    </div>
  );
};

export default VoteBar;
