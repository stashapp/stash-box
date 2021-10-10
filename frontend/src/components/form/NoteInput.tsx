import React, { useContext, useState } from "react";
import { Form, Tabs, Tab } from "react-bootstrap";
import cx from "classnames";

import AuthContext from "src/AuthContext";
import EditComment from "src/components/editCard/EditComment";
import { UseFormRegister } from "react-hook-form";

interface IProps {
  onChange?: (text: string) => void;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>;
  hasError?: boolean;
}

const NoteInput: React.FC<IProps> = ({
  onChange,
  className,
  register,
  hasError = false,
}) => {
  const auth = useContext(AuthContext);
  const [comment, setComment] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.currentTarget.value);
    onChange?.(e.currentTarget.value);
  };

  const textareaProps = register ? register("note") : { name: "note" };

  return (
    <div className={cx("NoteInput", { "is-invalid": hasError })}>
      <Tabs id="add-comment">
        <Tab eventKey="write" title="Write" className="NoteInput-tab">
          <Form.Control
            as="textarea"
            className={className}
            onInput={handleChange}
            rows={5}
            {...textareaProps}
          />
        </Tab>
        <Tab eventKey="preview" title="Preview" unmountOnExit mountOnEnter>
          <EditComment
            comment={comment}
            date={new Date().toString()}
            user={auth.user}
          />
        </Tab>
      </Tabs>
    </div>
  );
};

export default NoteInput;
