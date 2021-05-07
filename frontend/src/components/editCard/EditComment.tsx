import React from "react";
import Marked, { MarkedOptions } from "marked";
import DOMPurify from "dompurify";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";

import { Edit_findEdit_comments_user as User } from "src/graphql/definitions/Edit";
import { formatDateTime, userHref } from "src/utils";

const CLASSNAME = "EditComment";

interface Props {
  comment: string;
  date: string;
  user?: Pick<User, "name">;
}

DOMPurify.addHook("afterSanitizeAttributes", (node: Element) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener nofollow");
  }
});

const options: MarkedOptions = {
  gfm: true,
  breaks: true,
};

const EditComment: React.FC<Props> = ({ comment, date, user }) => (
  <Card className={CLASSNAME}>
    <Card.Body className="pb-0">
      {/* eslint-disable-next-line react/no-danger */}
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(Marked(comment, options)),
        }}
      />
    </Card.Body>
    <Card.Footer className="text-right">
      {user && <Link to={userHref(user)}>{user.name}</Link>}
      <span className="mx-1">&bull;</span>
      <span>{formatDateTime(date, false)}</span>
    </Card.Footer>
  </Card>
);

export default EditComment;
