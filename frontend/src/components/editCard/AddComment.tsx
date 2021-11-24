import React, { useContext, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { GraphQLError } from "graphql";
import { useEditComment } from "src/graphql";
import cx from "classnames";

import AuthContext from "src/AuthContext";
import { canEdit } from "src/utils";
import { NoteInput } from "src/components/form";

interface IProps {
  editID: string;
}

const AddComment: React.FC<IProps> = ({ editID }) => {
  const auth = useContext(AuthContext);
  const [showInput, setShowInput] = useState(false);
  const [errors, setErrors] = useState<readonly GraphQLError[]>([]);
  const [comment, setComment] = useState("");
  const [saveComment, { loading: saving }] = useEditComment();

  if (!showInput)
    return (
      <div className="d-flex">
        {!showInput && canEdit(auth.user) && (
          <Button
            className="ml-auto minimal"
            variant="link"
            onClick={() => setShowInput(true)}
          >
            Add Comment
          </Button>
        )}
      </div>
    );

  const handleSaveComment = async () => {
    const text = comment.trim();
    if (text) {
      const res = await saveComment({
        variables: { input: { id: editID, comment: text } },
      });
      if (res.errors) {
        setErrors(res.errors);
      } else {
        setShowInput(false);
      }
    }
  };

  return (
    <Form.Group>
      <NoteInput
        className={cx({ "is-invalid": errors.length > 0 })}
        onChange={(text) => setComment(text)}
      />
      <Form.Control.Feedback type="invalid" className="text-right">
        {errors?.[0]?.message}
      </Form.Control.Feedback>
      <div className="d-flex mt-2">
        <Button
          variant="secondary"
          className="ml-auto"
          onClick={() => setShowInput(false)}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          className="ml-2"
          disabled={saving || !comment.trim()}
          onClick={handleSaveComment}
        >
          Save
        </Button>
      </div>
    </Form.Group>
  );
};

export default AddComment;
