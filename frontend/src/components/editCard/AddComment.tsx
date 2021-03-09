import React, { useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { GraphQLError } from "graphql";
import { useEditComment } from "src/graphql";
import cx from "classnames";

interface IProps {
  editID: string;
}

const AddComment: React.FC<IProps> = ({ editID }) => {
  const [showInput, setShowInput] = useState(false);
  const [errors, setErrors] = useState<readonly GraphQLError[]>([]);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [saveComment, { loading: saving }] = useEditComment();

  if (!showInput)
    return (
      <div className="d-flex">
        {!showInput && (
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
    if (textRef.current) {
      const text = textRef?.current.value.trim();
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
    }
  };

  return (
    <Form.Group>
      <Form.Control
        as="textarea"
        name="note"
        className={cx({ "is-invalid": errors.length > 0 })}
        ref={textRef}
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
          disabled={saving}
          onClick={handleSaveComment}
        >
          Save
        </Button>
      </div>
    </Form.Group>
  );
};

export default AddComment;
