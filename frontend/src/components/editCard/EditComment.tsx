import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { Edit_findEdit_comments as Comment } from 'src/definitions/Edit';
import { formatDateTime } from 'src/utils';

const CLASSNAME = 'EditComment';

interface Props {
  comment: Comment;
}

const EditComment: React.FC<Props> = ({ comment }) => (
  <Card className={CLASSNAME}>
    <Card.Body className="pb-0">{ comment.comment }</Card.Body>
    <Card.Footer className="text-right">
      <Link to={`/users/${comment.user.id}`}>{comment.user.name}</Link>
      <span className="mx-1">&bull;</span>
      <span>{ formatDateTime(comment.date) }</span>
    </Card.Footer>
  </Card>
)

export default EditComment;
