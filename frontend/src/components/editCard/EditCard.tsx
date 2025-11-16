import type { FC } from "react";
import { Card, Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import cx from "classnames";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { Icon, Tooltip } from "src/components/fragments";

import { OperationEnum, type EditFragment } from "src/graphql";

import { formatDateTime, editHref, userHref, formatOrdinals } from "src/utils";
import ModifyEdit from "./ModifyEdit";
import EditComment from "./EditComment";
import EditHeader from "./EditHeader";
import AddComment from "./AddComment";
import VoteBar from "./VoteBar";
import EditExpiration from "./EditExpiration";
import EditStatus from "./EditStatus";
import Votes from "./Votes";

const CLASSNAME = "EditCard";

interface Props {
  edit: EditFragment;
  showVotes?: boolean;
  showVoteBar?: boolean;
  hideDiff?: boolean;
}

const EditCardComponent: FC<Props> = ({
  edit,
  showVotes = false,
  showVoteBar = true,
  hideDiff = false,
}) => {
  const title = `${edit.operation.toLowerCase()} ${edit.target_type.toLowerCase()}`;
  const created = new Date(edit.created);

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
  const comments = (edit.comments ?? []).map((comment) => (
    <EditComment {...comment} key={comment.id} />
  ));

  return (
    <Card className={cx(CLASSNAME, "mb-3")}>
      <Card.Header className="row">
        <div className="flex-column col-4">
          <Link to={editHref(edit)}>
            <h5 className="text-capitalize">{title.toLowerCase()}</h5>
          </Link>
          <div>
            <b className="me-2">Author:</b>
            {edit.user ? (
              <Link to={userHref(edit.user)}>
                <span>{edit.user.name}</span>
              </Link>
            ) : (
              <span>Deleted User</span>
            )}
            {edit.bot && (
              <Tooltip
                text="Edit submitted by an automated script"
                delay={50}
                placement="auto"
              >
                <span>
                  <Icon icon={faRobot} className="ms-2" />
                </span>
              </Tooltip>
            )}
          </div>
          <div>
            <b className="me-2">Created:</b>
            <span>{formatDateTime(created)}</span>
          </div>
          {edit.updated && edit.update_count > 0 && (
            <div>
              <b className="me-2">Updated:</b>
              <span>{formatDateTime(edit.updated)}</span>
              <small className="text-muted align-text-top ms-2">{`${formatOrdinals(edit.update_count)} revision`}</small>
            </div>
          )}
        </div>
        <div className="flex-column col-4 ms-auto text-end">
          <div>
            <b className="me-2">Status:</b>
            <EditStatus {...edit} />
            <EditExpiration edit={edit} />
            {showVoteBar && <VoteBar edit={edit} />}
          </div>
        </div>
      </Card.Header>
      <hr />
      <Card.Body>
        <EditHeader edit={edit} compact={hideDiff} />
        {!hideDiff ? (
          <>
            {creation}
            {modifications}
            <Row className="mt-2">
              <Col md={{ offset: 4, span: 8 }}>
                {showVotes && <Votes edit={edit} />}
                {comments}
                <AddComment editID={edit.id} />
              </Col>
            </Row>
          </>
        ) : (
          showVotes && <Votes edit={edit} />
        )}
      </Card.Body>
    </Card>
  );
};

export default EditCardComponent;
