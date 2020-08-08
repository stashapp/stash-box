import React from "react";
import { Card, Badge, BadgeProps } from "react-bootstrap";
import { Link } from "react-router-dom";

import {
  Edits_queryEdits_edits as Edit,
} from "src/definitions/Edits";
import { OperationEnum, VoteStatusEnum } from "src/definitions/globalTypes";

import ModifyEdit from './ModifyEdit';
import DestroyEdit from './DestroyEdit';
import MergeEdit from './MergeEdit';

interface EditsProps {
  edit: Edit,
}

const EditCardComponent: React.FC<EditsProps> = ({ edit }) => {
  const title = `${edit.operation.toLowerCase()} ${edit.target_type.toLowerCase()}`;
  const date = new Date(edit.created);
  const locale = navigator.languages[0];
  let editVariant:BadgeProps["variant"] = "warning";
  if (edit.status === VoteStatusEnum.REJECTED || edit.status === VoteStatusEnum.IMMEDIATE_REJECTED)
    editVariant = "danger";
  else if (edit.status === VoteStatusEnum.ACCEPTED || edit.status === VoteStatusEnum.IMMEDIATE_ACCEPTED)
    editVariant = "success";

  const merges = <MergeEdit merges={edit.merge_sources} target={edit.target} />;
  const creation = edit.operation === OperationEnum.CREATE && <ModifyEdit details={edit.details} />;
  const modifications = edit.operation !== OperationEnum.CREATE && <ModifyEdit details={edit.details} target={edit.target} />;
  const destruction = edit.operation === OperationEnum.DESTROY && <DestroyEdit target={edit.target} />;

  return (
    <Card>
      <Card.Header className="row">
        <div className="flex-column col-4">
          <Link to={`/edits/${edit?.id}`}><h5 className="text-capitalize">{ title.toLowerCase() }</h5></Link>
          <div>
            <b className="mr-2">Author:</b>
            <Link to={`/users/${edit.user.name}`}>
              <span>{edit.user.name}</span>
            </Link>
          </div>
        </div>
        <div className="flex-column col-4 ml-auto text-right">
          <div><b>Created:</b> { `${date.toLocaleString('en-us', { month: 'short', year: 'numeric', day: 'numeric', timeZone: 'UTC' } )} ${date.toLocaleTimeString(locale, { timeZone: 'UTC' })}` }</div>
          <div>
            <b className="mr-2">Status:</b>
            <Badge variant={editVariant}>{ edit.status }</Badge>
          </div>
        </div>
      </Card.Header>
      <hr />
      <Card.Body className="my-2">
        { merges }
        { creation }
        { modifications }
        { destruction }
      </Card.Body>
    </Card>
  );
}

export default EditCardComponent;
