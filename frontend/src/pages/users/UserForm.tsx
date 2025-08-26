import type { FC } from "react";
import { Button, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";

import { RoleEnum, type UserUpdateInput } from "src/graphql";

const schema = yup.object({
  id: yup.string(),
  name: yup.string().required("Username is required"),
  email: yup.string().email().required("Email is required"),
  password: yup
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
  roles: yup.array().of(yup.string().required()).required(),
});

type UserFormData = yup.Asserts<typeof schema>;

export type UserData = {
  name: string;
  email: string;
  password: string;
  roles: RoleEnum[];
};

interface UserProps {
  user: UserUpdateInput;
  error?: string;
  callback: (data: UserData, id?: string) => void;
}

const roles = Object.keys(RoleEnum).map((role) => ({
  label: role,
  value: role,
}));

const UserForm: FC<UserProps> = ({ user, callback, error }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (formData: UserFormData) => {
    const userData = {
      ...formData,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      roles: formData.roles as RoleEnum[],
    };
    callback(userData, formData.id);
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Form.Control type="hidden" value={user.id} />
        <Form.Group controlId="username" className="col mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            className={cx({ "is-invalid": errors.name })}
            placeholder="Username"
            defaultValue={user.name ?? ""}
            {...register("name")}
          />
          <div className="invalid-feedback">{errors?.name?.message}</div>
        </Form.Group>
      </Row>
      <Row>
        <Form.Group controlId="email" className="col mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            className={cx({ "is-invalid": errors.email })}
            type="email"
            placeholder="Email"
            defaultValue={user.email ?? ""}
            {...register("email")}
          />
          <div className="invalid-feedback">{errors?.email?.message}</div>
        </Form.Group>
      </Row>
      <Row>
        <Form.Group controlId="password" className="col mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            className={cx({ "is-invalid": errors.password })}
            type="password"
            placeholder="Password"
            defaultValue={user.password ?? ""}
            {...register("password")}
          />
          <div className="invalid-feedback">{errors?.password?.message}</div>
        </Form.Group>
      </Row>
      <Row>
        <Form.Group className="col mb-3">
          <Form.Label>Roles</Form.Label>
          <Controller
            name="roles"
            control={control}
            defaultValue={(user.roles ?? []) as string[]}
            render={({ field: { onChange, value } }) => (
              <Select
                classNamePrefix="react-select"
                name="roles"
                options={roles}
                placeholder="User roles"
                onChange={(vals) => onChange(vals.map((v) => v.value) ?? [])}
                defaultValue={roles.filter((r) => value.includes(r.value))}
                isMulti
              />
            )}
          />
        </Form.Group>
      </Row>
      <Row>
        <div className="col">
          <Button type="submit">Create</Button>
          <Button
            variant="secondary"
            className="ms-2"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <div className="invalid-feedback d-block">{error}</div>
        </div>
      </Row>
    </Form>
  );
};

export default UserForm;
