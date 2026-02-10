import { type FC, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useEditComment } from "src/graphql";
import cx from "classnames";

import { NoteInput } from "src/components/form";
import { useCurrentUser } from "src/hooks";
import { CombinedGraphQLErrors } from "@apollo/client";

interface IProps {
  editID: string;
}

const AddComment: FC<IProps> = ({ editID }) => {
  const { isEditor } = useCurrentUser();
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState<string>();
  const [comment, setComment] = useState("");
  const [saveComment, { loading: saving }] = useEditComment();

  if (!showInput)
    return (
      <div className="d-flex">
        {!showInput && isEditor && (
          <Button
            className="ms-auto minimal"
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
      if (CombinedGraphQLErrors.is(res.error)) {
        setError(res.error.message);
      } else {
        setShowInput(false);
        setError("");
      }
    }
  };

  return (
    <Form.Group className="mb-3">
      <NoteInput
        className={cx({ "is-invalid": error })}
        onChange={(text) => setComment(text)}
      />
      <Form.Control.Feedback type="invalid" className="text-end">
        {error}
      </Form.Control.Feedback>
      <div className="d-flex mt-2">
        <Button
          variant="secondary"
          className="ms-auto"
          onClick={() => setShowInput(false)}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          className="ms-2"
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
