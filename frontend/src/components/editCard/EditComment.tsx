import cx from "classnames";
import { type FC, useState } from "react";
import { Badge, Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

import { useCurrentUser } from "src/hooks";
import { formatDateTime, userHref } from "src/utils";
import CommentMarkdown from "./CommentMarkdown";
import EditCommentModal from "./EditCommentModal";
import HideCommentModal from "./HideCommentModal";

const CLASSNAME = "EditComment";

interface Props {
  id: string;
  comment: string;
  date: string;
  updated?: string | null;
  hidden?: boolean;
  isPrimary?: boolean;
  user?: { name: string; id: string } | null;
  mentions?: readonly { id: string; name: string }[];
  /** Rendered as a draft preview (e.g. NoteInput) - suppresses moderator controls */
  preview?: boolean;
}

const EditComment: FC<Props> = ({
  id,
  comment,
  date,
  updated,
  hidden,
  isPrimary,
  user,
  mentions,
  preview,
}) => {
  const { isModerator } = useCurrentUser();
  const [showEdit, setShowEdit] = useState(false);
  const [showHide, setShowHide] = useState(false);

  const showControls = isModerator && !preview;

  return (
    <Card
      id={`comment-${id}`}
      className={cx(CLASSNAME, { "EditComment-hidden": hidden })}
    >
      <Card.Body className="pb-0">
        <CommentMarkdown text={comment} unique={id} mentions={mentions} />
      </Card.Body>
      <Card.Footer className="d-flex align-items-center justify-content-end">
        {showControls && (
          <span className="EditComment-actions me-auto">
            <Button
              size="sm"
              variant="outline-danger"
              className="me-2"
              onClick={() => setShowEdit(true)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              disabled={isPrimary}
              title={
                isPrimary ? "The submission comment can't be hidden" : undefined
              }
              onClick={() => setShowHide(true)}
            >
              {hidden ? "Unhide" : "Hide"}
            </Button>
          </span>
        )}
        {hidden && (
          <Badge bg="danger" className="me-2">
            Hidden by moderator
          </Badge>
        )}
        {user ? (
          <Link to={userHref(user)}>{user.name}</Link>
        ) : (
          <span>Deleted User</span>
        )}
        <span className="mx-1">&bull;</span>
        <span>{formatDateTime(date, false)}</span>
        {updated && (
          <span className="ms-1" title={formatDateTime(updated, false)}>
            (edited by moderator)
          </span>
        )}
      </Card.Footer>
      {showControls && (
        <>
          <EditCommentModal
            commentId={id}
            text={comment}
            show={showEdit}
            onHide={() => setShowEdit(false)}
          />
          <HideCommentModal
            commentId={id}
            hidden={hidden ?? false}
            show={showHide}
            onHide={() => setShowHide(false)}
          />
        </>
      )}
    </Card>
  );
};

export default EditComment;
