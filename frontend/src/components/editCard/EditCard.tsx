import { faRobot } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import type { FC } from "react";
import { Card, Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon, Tooltip } from "src/components/fragments";

import { type EditFragment, OperationEnum } from "src/graphql";

import { editHref, formatDateTime, formatOrdinals, userHref } from "src/utils";
import AddComment from "./AddComment";
import EditComment from "./EditComment";
import EditExpiration from "./EditExpiration";
import EditHeader from "./EditHeader";
import EditStatus from "./EditStatus";
import ModifyEdit from "./ModifyEdit";
import type { EditCardEdit } from "./types";
import VoteBar from "./VoteBar";
import Votes from "./Votes";

const CLASSNAME = "EditCard";

type Props = { showVotes?: boolean } & (
  | { edit: EditCardEdit; compact: true }
  | { edit: EditFragment; compact?: false }
);

const EditCardComponent: FC<Props> = (props) => {
  const { edit, showVotes = false } = props;
  const compact = props.compact === true;
  const title = `${edit.operation.toLowerCase()} ${edit.target_type.toLowerCase()}`;
  const created = new Date(edit.created);

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
            {!compact && <VoteBar edit={edit} />}
          </div>
        </div>
      </Card.Header>
      <hr />
      <Card.Body>
        <EditHeader edit={edit} compact={compact} />
        {props.compact ? (
          showVotes && <Votes edit={edit} />
        ) : (
          <>
            {props.edit.operation === OperationEnum.CREATE && (
              <ModifyEdit details={props.edit.details} />
            )}
            {props.edit.operation !== OperationEnum.CREATE && (
              <ModifyEdit
                details={props.edit.details}
                oldDetails={props.edit.old_details}
                options={props.edit.options ?? undefined}
              />
            )}
            <Row className="mt-2">
              <Col md={{ offset: 4, span: 8 }}>
                {showVotes && <Votes edit={edit} />}
                {(props.edit.comments ?? []).map((comment, index) => (
                  <EditComment
                    {...comment}
                    isPrimary={index === 0}
                    key={comment.id}
                  />
                ))}
                <AddComment editID={edit.id} />
              </Col>
            </Row>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default EditCardComponent;
