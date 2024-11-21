import { FC } from "react";
import { Button, Form } from "react-bootstrap";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import { useNavigate } from "react-router-dom";

const schema = yup.object({
  id: yup.string(),
  existingPassword: yup.string().required("Existing password is required"),
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .test(
      "uniqueness",
      "Password must have at least 5 unique characters",
      (value) =>
        value !== undefined &&
        value
          .split("")
          .filter(
            (item: string, i: number, ar: string[]) => ar.indexOf(item) === i,
          )
          .join("").length >= 5,
    )
    .required("Password is required"),
  confirmNewPassword: yup
    .string()
    .nullable()
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

const UserForm: FC<UserProps> = ({ callback, error }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
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
      <Form.Group controlId="existingPassword" className="mb-3">
        <Form.Control
          className={cx({ "is-invalid": errors.existingPassword })}
          type="password"
          placeholder="Existing Password"
          {...register("existingPassword")}
        />
        <div className="invalid-feedback">
          {errors?.existingPassword?.message}
        </div>
      </Form.Group>
      <Form.Group controlId="newPassword" className="mb-3">
        <Form.Control
          className={cx({ "is-invalid": errors.newPassword })}
          type="password"
          placeholder="New Password"
          {...register("newPassword")}
        />
        <div className="invalid-feedback">{errors?.newPassword?.message}</div>
      </Form.Group>
      <Form.Group controlId="confirmNewPassword" className="mb-3">
        <Form.Control
          className={cx({ "is-invalid": errors.confirmNewPassword })}
          type="password"
          placeholder="Confirm New Password"
          {...register("confirmNewPassword")}
        />
        <div className="invalid-feedback">
          {errors?.confirmNewPassword?.message}
        </div>
      </Form.Group>
      <div>
        <Button type="submit">Save</Button>
        <Button
          variant="secondary"
          className="ms-2"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        <div className="invalid-feedback d-block">{error}</div>
      </div>
    </Form>
  );
};

export default UserForm;
