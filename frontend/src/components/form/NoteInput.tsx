import cx from "classnames";
import { type ChangeEvent, type FC, useState } from "react";
import { Form, Tab, Tabs } from "react-bootstrap";
import type { UseFormRegister } from "react-hook-form";
import EditComment from "src/components/editCard/EditComment";
import { useCurrentUser } from "src/hooks";

interface IProps {
  onChange?: (text: string) => void;
  className?: string;
  register?: UseFormRegister<{ note: string }>;
  hasError?: boolean;
  initialValue?: string;
}

const NoteInput: FC<IProps> = ({
  onChange,
  className,
  register,
  hasError = false,
  initialValue = "",
}) => {
  const { user } = useCurrentUser();
  const [comment, setComment] = useState(initialValue);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.currentTarget.value);
    onChange?.(e.currentTarget.value);
  };

  const textareaProps = register ? register("note") : { name: "note" };
  const now = new Date().toISOString();

  return (
    <div className={cx("NoteInput", { "is-invalid": hasError })}>
      <Tabs id="add-comment">
        <Tab eventKey="write" title="Write" className="NoteInput-tab">
          <Form.Control
            as="textarea"
            className={className}
            onInput={handleChange}
            rows={5}
            defaultValue={initialValue}
            {...textareaProps}
          />
        </Tab>
        <Tab eventKey="preview" title="Preview" unmountOnExit mountOnEnter>
          <EditComment
            id={`${user?.id}-${now}`}
            comment={comment}
            date={now}
            user={user}
            preview
          />
        </Tab>
      </Tabs>
    </div>
  );
};

export default NoteInput;
