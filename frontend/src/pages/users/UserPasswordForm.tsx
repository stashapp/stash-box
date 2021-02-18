import React from "react";
import { Button, Form } from "react-bootstrap";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import { useHistory } from "react-router-dom";

const schema = yup.object().shape({
  id: yup.string(),
  existingPassword: yup.string().required("Existing password is required"),
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .test(
      "uniqueness",
      "Password must have at least 5 unique characters",
      (value) =>
        value !== undefined && value
          .split("")
          .filter(
            (item: string, i: number, ar: string[]) => ar.indexOf(item) === i
          )
          .join("").length >= 5
    )
    .required("Password is required"),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref("newPassword"), null], "Passwords don't match")
    .required("Password is required"),
});
type UserFormData = yup.InferType<typeof schema>;

export type UserPasswordData = {
  newPassword: string;
  existingPassword: string;
};

interface UserProps {
  error?: string;
  callback: (data: UserPasswordData) => void;
}

const UserForm: React.FC<UserProps> = ({ callback, error }) => {
  const history = useHistory();
  const { register, handleSubmit, errors } = useForm<UserFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (formData: UserFormData) => {
    const userData = {
      existingPassword: formData.existingPassword,
      newPassword: formData.confirmNewPassword,
    };
    callback(userData);
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="existingPassword">
        <Form.Control
          className={cx({ "is-invalid": errors.existingPassword })}
          name="existingPassword"
          type="password"
          placeholder="Existing Password"
          ref={register}
        />
        <div className="invalid-feedback">
          {errors?.existingPassword?.message}
        </div>
      </Form.Group>
      <Form.Group controlId="newPassword">
        <Form.Control
          className={cx({ "is-invalid": errors.newPassword })}
          name="newPassword"
          type="password"
          placeholder="New Password"
          ref={register}
        />
        <div className="invalid-feedback">{errors?.newPassword?.message}</div>
      </Form.Group>
      <Form.Group controlId="confirmNewPassword">
        <Form.Control
          className={cx({ "is-invalid": errors.confirmNewPassword })}
          name="confirmNewPassword"
          type="password"
          placeholder="Confirm New Password"
          ref={register}
        />
        <div className="invalid-feedback">
          {errors?.confirmNewPassword?.message}
        </div>
      </Form.Group>
      <div>
        <Button type="submit">Save</Button>
        <Button
          variant="secondary"
          className="ml-2"
          onClick={() => history.goBack()}
        >
          Cancel
        </Button>
        <div className="invalid-feedback d-block">{error}</div>
      </div>
    </Form>
  );
};

export default UserForm;
