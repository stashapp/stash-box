import { FC } from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";

import { Edit_findEdit_comments_user as User } from "src/graphql/definitions/Edit";
import { formatDateTime, userHref, Markdown } from "src/utils";

const CLASSNAME = "EditComment";

interface Props {
  id: string;
  comment: string;
  date: string;
  user?: Pick<User, "name"> | null;
}

const EditComment: FC<Props> = ({ id, comment, date, user }) => (
  <Card className={CLASSNAME}>
    <Card.Body className="pb-0">
      <Markdown text={comment} unique={id} />
    </Card.Body>
    <Card.Footer className="text-end">
      {user ? (
        <Link to={userHref(user)}>{user.name}</Link>
      ) : (
        <span>Deleted User</span>
      )}
      <span className="mx-1">&bull;</span>
      <span>{formatDateTime(date, false)}</span>
    </Card.Footer>
  </Card>
);

export default EditComment;
