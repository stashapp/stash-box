import React from "react";
import { Button, Form } from "react-bootstrap";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers";
import cx from "classnames";

const schema = yup.object().shape({
  id: yup.string(),
  existingPassword: yup.string(),
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .test(
      "uniqueness",
      "Password must have at least 5 unique characters",
      (value) =>
        value
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
  const { register, handleSubmit, errors } = useForm<UserFormData>({
    resolver: yupResolver(schema)
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
      <Form.Group controlId="existingPassword" className="col-2">
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
      <Form.Group controlId="newPassword" className="col-2">
        <Form.Control
          className={cx({ "is-invalid": errors.newPassword })}
          name="newPassword"
          type="password"
          placeholder="New Password"
          ref={register}
        />
        <div className="invalid-feedback">{errors?.newPassword?.message}</div>
      </Form.Group>
      <Form.Group controlId="confirmNewPassword" className="col-2">
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
      <div className="offset-2">
        <Button type="submit">Save</Button>
        <div className="invalid-feedback d-block">{error}</div>
      </div>
    </Form>
  );
};

export default UserForm;
