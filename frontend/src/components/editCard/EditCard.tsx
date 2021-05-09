import React from "react";
import { Badge, BadgeProps, Card, Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

import { Edits_queryEdits_edits as Edit } from "src/graphql/definitions/Edits";
import { OperationEnum, VoteStatusEnum } from "src/graphql";

import { formatDateTime, editHref, userHref } from "src/utils";
import { EditStatusTypes } from "src/constants/enums";
import ModifyEdit from "./ModifyEdit";
import DestroyEdit from "./DestroyEdit";
import MergeEdit from "./MergeEdit";
import EditComment from "./EditComment";
import EditHeader from "./EditHeader";
import AddComment from "./AddComment";

interface EditsProps {
  edit: Edit;
}

const EditCardComponent: React.FC<EditsProps> = ({ edit }) => {
  const title = `${edit.operation.toLowerCase()} ${edit.target_type.toLowerCase()}`;
  const created = new Date(edit.created);
  const updated = new Date(edit.updated);
  let editVariant: BadgeProps["variant"] = "warning";
  if (
    edit.status === VoteStatusEnum.REJECTED ||
    edit.status === VoteStatusEnum.IMMEDIATE_REJECTED
  )
    editVariant = "danger";
  else if (
    edit.status === VoteStatusEnum.ACCEPTED ||
    edit.status === VoteStatusEnum.IMMEDIATE_ACCEPTED
  )
    editVariant = "success";

  const merges = edit.operation === OperationEnum.MERGE && (
    <MergeEdit
      merges={edit.merge_sources}
      target={edit.target}
      options={edit.options ?? undefined}
    />
  );
  const creation = edit.operation === OperationEnum.CREATE && (
    <ModifyEdit details={edit.details} />
  );
  const modifications = edit.operation !== OperationEnum.CREATE && (
    <ModifyEdit
      details={edit.details}
      oldDetails={edit.old_details}
      options={edit.options ?? undefined}
    />
  );
  const destruction = edit.operation === OperationEnum.DESTROY && (
    <DestroyEdit target={edit.target} />
  );
  const comments = (edit.comments ?? []).map((comment) => (
    <EditComment {...comment} />
  ));

  return (
    <Card>
      <Card.Header className="row">
        <div className="flex-column col-4">
          <Link to={editHref(edit)}>
            <h5 className="text-capitalize">{title.toLowerCase()}</h5>
          </Link>
          <div>
            <b className="mr-2">Author:</b>
            <Link to={userHref(edit.user)}>
              <span>{edit.user.name}</span>
            </Link>
          </div>
        </div>
        <div className="flex-column col-4 ml-auto text-right">
          <div>
            <b className="mr-2">Created:</b>
            <span>{formatDateTime(created)}</span>
          </div>
          <div>
            <b className="mr-2">Updated:</b>
            <span>{formatDateTime(updated)}</span>
          </div>
          <div>
            <b className="mr-2">Status:</b>
            <Badge className="text-uppercase" variant={editVariant}>
              {EditStatusTypes[edit.status]}
            </Badge>
          </div>
        </div>
      </Card.Header>
      <hr />
      <Card.Body>
        <EditHeader edit={edit} />
        {merges}
        {creation}
        {modifications}
        {destruction}
        <Row className="mt-2">
          <Col md={{ offset: 4, span: 8 }}>
            {comments}
            <AddComment editID={edit.id} />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default EditCardComponent;
